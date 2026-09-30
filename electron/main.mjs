/**
 * Sahayak desktop shell (Electron main process).
 *
 * One loopback HTTP server serves the built React bundle AND the /sarvam/*
 * bridge, so the renderer runs the exact web code with a same-origin API.
 *
 * Hardening:
 * - bound to 127.0.0.1 on a random free port, Host header checked (blocks DNS
 *   rebinding from web pages);
 * - /sarvam/* requires a per-launch random token that only this app's own
 *   session injects, so other local processes / browser tabs cannot spend the
 *   user's Sarvam quota;
 * - the Sarvam key is encrypted with safeStorage (DPAPI on Windows) and never
 *   crosses into the renderer;
 * - contextIsolation + sandbox, no Node in the page, navigation locked to the
 *   app origin, external links go to the system browser/dialer.
 */
import { app, BrowserWindow, ipcMain, Menu, safeStorage, session, shell } from 'electron';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, rmSync, statSync, createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleSarvam } from './sarvam.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(here, '..', 'dist');
const TOKEN = randomBytes(24).toString('hex');
const TOKEN_HEADER = 'x-sahayak-token';

app.setAppUserModelId('in.sahayak.desktop');
if (!app.requestSingleInstanceLock()) app.quit();

// ---------------------------------------------------------------- key store

const keyFile = () => path.join(app.getPath('userData'), 'sarvam-key.bin');
const plainKeyFile = () => path.join(app.getPath('userData'), 'sarvam-key.txt');
let cachedKey = null;

function loadKey() {
  if (cachedKey !== null) return cachedKey;
  cachedKey = '';
  try {
    if (existsSync(keyFile()) && safeStorage.isEncryptionAvailable()) {
      cachedKey = safeStorage.decryptString(readFileSync(keyFile()));
    } else if (existsSync(plainKeyFile())) {
      cachedKey = readFileSync(plainKeyFile(), 'utf8').trim();
    }
  } catch (err) {
    console.error('[sahayak] could not read saved key:', err?.message);
  }
  // A developer can still run with an env var and no saved key.
  if (!cachedKey && process.env.SARVAM_API_KEY) cachedKey = process.env.SARVAM_API_KEY;
  return cachedKey;
}

function keyStatus() {
  const encrypted = safeStorage.isEncryptionAvailable();
  return { configured: Boolean(loadKey()), encrypted };
}

function saveKey(key) {
  const k = String(key ?? '').trim();
  if (!/^[A-Za-z0-9_\-.]{16,200}$/.test(k)) throw new Error('That does not look like a Sarvam API key.');
  if (safeStorage.isEncryptionAvailable()) {
    writeFileSync(keyFile(), safeStorage.encryptString(k));
    rmSync(plainKeyFile(), { force: true });
  } else {
    writeFileSync(plainKeyFile(), k, { encoding: 'utf8', mode: 0o600 });
  }
  cachedKey = k;
  return keyStatus();
}

function clearKey() {
  rmSync(keyFile(), { force: true });
  rmSync(plainKeyFile(), { force: true });
  cachedKey = '';
  return { configured: false, encrypted: safeStorage.isEncryptionAvailable() };
}

// ------------------------------------------------------------ static server

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob: data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ');

function serveStatic(urlPath, res) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.resolve(DIST, '.' + rel);
  // Path traversal guard: must stay inside dist/.
  if (!file.startsWith(DIST + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  let target = file;
  if (!existsSync(target) || !statSync(target).isFile()) target = path.join(DIST, 'index.html'); // SPA fallback
  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  createReadStream(target).pipe(res);
}

function startServer() {
  return new Promise((resolve, reject) => {
    let expectedHost = '';
    const server = createServer((req, res) => {
      if (req.headers.host !== expectedHost) {
        res.writeHead(421).end('Misdirected request');
        return;
      }
      const url = req.url || '/';
      if (url.startsWith('/sarvam/')) {
        if (req.headers[TOKEN_HEADER] !== TOKEN) {
          res.writeHead(403, { 'Content-Type': 'application/json' }).end('{"error":"forbidden"}');
          return;
        }
        void handleSarvam(url.slice('/sarvam'.length).split('?')[0], req, res, loadKey);
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405).end();
        return;
      }
      serveStatic(url, res);
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      expectedHost = `127.0.0.1:${port}`;
      resolve(`http://${expectedHost}`);
    });
  });
}

// ------------------------------------------------------------------- window

const stateFile = () => path.join(app.getPath('userData'), 'window.json');

function loadBounds() {
  try {
    return JSON.parse(readFileSync(stateFile(), 'utf8'));
  } catch {
    return { width: 1280, height: 820 };
  }
}

const EXTERNAL = /^(https:|tel:|mailto:)/i;

let win = null;

async function createWindow() {
  if (!existsSync(path.join(DIST, 'index.html'))) {
    console.error(`[sahayak] missing build at ${DIST} — run "npm run build" first`);
  }
  const origin = await startServer();

  // Only this app's own requests carry the bridge token.
  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: [`${origin}/sarvam/*`] }, (details, cb) => {
    details.requestHeaders[TOKEN_HEADER] = TOKEN;
    cb({ requestHeaders: details.requestHeaders });
  });
  // Microphone for voice input; everything else denied.
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb, details) => {
    const fromApp = (details.requestingUrl || wc.getURL()).startsWith(origin);
    cb(fromApp && (permission === 'media' || permission === 'clipboard-sanitized-write'));
  });
  session.defaultSession.setPermissionCheckHandler((_wc, permission, requestingOrigin) =>
    requestingOrigin === origin && (permission === 'media' || permission === 'clipboard-sanitized-write'),
  );

  const b = loadBounds();
  win = new BrowserWindow({
    ...b,
    minWidth: 360,
    minHeight: 560,
    title: 'Sahayak',
    backgroundColor: '#ffffff',
    show: false,
    autoHideMenuBar: true,
    icon: path.join(here, 'icon.png'),
    webPreferences: {
      preload: path.join(here, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });
  if (b.maximized) win.maximize();

  const saveBounds = () => {
    if (!win || win.isDestroyed()) return;
    try {
      writeFileSync(stateFile(), JSON.stringify({ ...win.getNormalBounds(), maximized: win.isMaximized() }));
    } catch {
      /* non-fatal */
    }
  };
  win.on('close', saveBounds);
  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (EXTERNAL.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith(origin)) return;
    e.preventDefault();
    if (EXTERNAL.test(url)) void shell.openExternal(url);
  });

  await win.loadURL(`${origin}/`);
}

function buildMenu() {
  const template = [
    {
      label: 'Sahayak',
      submenu: [{ role: 'reload' }, { role: 'forceReload' }, { type: 'separator' }, { role: 'quit' }],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(app.isPackaged ? [] : [{ role: 'toggleDevTools' }]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Emergency: dial 112', click: () => void shell.openExternal('tel:112') },
        { label: 'Sarvam AI (get a key)', click: () => void shell.openExternal('https://dashboard.sarvam.ai/') },
        { type: 'separator' },
        { label: `Version ${app.getVersion()}`, enabled: false },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// --------------------------------------------------------------------- IPC

ipcMain.handle('sahayak:key-status', () => keyStatus());
ipcMain.handle('sahayak:key-set', (_e, key) => saveKey(key));
ipcMain.handle('sahayak:key-clear', () => clearKey());
ipcMain.handle('sahayak:open-external', (_e, url) => {
  if (typeof url === 'string' && EXTERNAL.test(url)) return shell.openExternal(url);
  return undefined;
});
ipcMain.handle('sahayak:version', () => app.getVersion());

app.on('second-instance', () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

app.whenReady().then(async () => {
  buildMenu();
  await createWindow();
  // Smoke hook: `SAHAYAK_SMOKE=1` loads the app, reports, and quits.
  if (process.env.SAHAYAK_SMOKE === '1') {
    const report = await win.webContents.executeJavaScript(
      `(async () => {
        await new Promise(r => setTimeout(r, 2500));
        const h = await fetch('/sarvam/health').then(r => r.json()).catch(e => ({ error: String(e) }));
        return JSON.stringify({
          title: document.title,
          hasRoot: !!document.querySelector('#root > *'),
          text: document.body.innerText.slice(0, 160),
          desktop: !!window.sahayakDesktop,
          health: h,
          sheets: document.styleSheets.length
        });
      })()`,
    );
    const origin = new URL(win.webContents.getURL()).origin;
    const untokened = await fetch(`${origin}/sarvam/health`).then((r) => r.status).catch(() => -1);
    const wrongHost = await fetch(`${origin}/`, { headers: { host: 'evil.example' } })
      .then((r) => r.status)
      .catch(() => -1);
    const merged = { ...JSON.parse(report), untokened, wrongHost };
    console.log('[sahayak-smoke] ' + JSON.stringify(merged));
    app.exit(0);
  }
});

app.on('window-all-closed', () => app.quit());
