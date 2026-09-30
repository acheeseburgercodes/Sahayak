// Packages the desktop app into release/Sahayak-win32-x64/Sahayak.exe.
// Prereq: `npm run build` (dist/). Uses the Electron zip already in the local
// cache, so no installer toolchain or network download is needed.
import { packager } from '@electron/packager';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('dist/ missing - run "npm run build" first');
  process.exit(1);
}

// Ship only what the main process needs: the built bundle, the electron/
// folder and package.json. The main process has no npm dependencies.
const KEEP = [/^\/dist(\/|$)/, /^\/electron(\/|$)/, /^\/package\.json$/];

const out = await packager({
  dir: root,
  out: path.join(root, 'release'),
  name: 'Sahayak',
  executableName: 'Sahayak',
  platform: 'win32',
  arch: 'x64',
  electronVersion: '33.4.11',
  icon: path.join(root, 'electron', 'icon.ico'),
  overwrite: true,
  asar: true,
  prune: false,
  ignore: (p) => p !== '' && !KEEP.some((re) => re.test(p.replace(/\\/g, '/'))),
  appCopyright: 'Sahayak',
  win32metadata: {
    CompanyName: 'Sahayak',
    FileDescription: 'Sahayak - government services and AI helpers',
    ProductName: 'Sahayak',
  },
});
console.log('packaged:', out.join(', '));
