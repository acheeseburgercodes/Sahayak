// Launches the desktop app (dev Electron, or the packaged exe with --packaged)
// in SAHAYAK_SMOKE mode: it renders the real bundle, calls /sarvam/health
// through the tokened bridge, prints one JSON line and exits. Also probes the
// bridge from OUTSIDE the app to prove an untokened caller is refused.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import electronPath from 'electron';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packaged = process.argv.includes('--packaged');
const cmd = packaged ? path.join(root, 'release', 'Sahayak-win32-x64', 'Sahayak.exe') : electronPath;
const args = packaged ? [] : ['.'];

const child = spawn(cmd, args, {
  cwd: root,
  env: { ...process.env, SAHAYAK_SMOKE: '1', ELECTRON_ENABLE_LOGGING: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let out = '';
child.stdout.on('data', (d) => (out += d));
child.stderr.on('data', (d) => (out += d));

const timer = setTimeout(() => {
  console.error('FAIL: desktop smoke timed out');
  child.kill();
  process.exit(1);
}, 45_000);

child.on('exit', () => {
  clearTimeout(timer);
  const line = out.split(/\r?\n/).find((l) => l.includes('[sahayak-smoke]'));
  if (!line) {
    console.error('FAIL: no smoke report\n' + out.slice(-1500));
    process.exit(1);
  }
  const r = JSON.parse(line.slice(line.indexOf('{')));
  const checks = [
    ['renders React root', r.hasRoot],
    ['desktop bridge exposed', r.desktop],
    ['stylesheet loaded', r.sheets > 0],
    ['tokened /sarvam/health ok', r.health?.ok === true && r.health?.shell === 'desktop'],
    ['untokened bridge call refused (403)', r.untokened === 403],
  ];
  let failed = 0;
  for (const [name, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
    if (!ok) failed += 1;
  }
  console.log(`title: ${r.title} | configured: ${r.health?.configured} | text: ${r.text.replace(/\s+/g, ' ').slice(0, 80)}`);
  process.exit(failed ? 1 : 0);
});
