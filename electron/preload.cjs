// Sandboxed preload: exposes a tiny, typed bridge. No Node APIs reach the page.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sahayakDesktop', {
  platform: 'desktop',
  version: process.env.npm_package_version || '',
  keyStatus: () => ipcRenderer.invoke('sahayak:key-status'),
  setKey: (key) => ipcRenderer.invoke('sahayak:key-set', String(key)),
  clearKey: () => ipcRenderer.invoke('sahayak:key-clear'),
  openExternal: (url) => ipcRenderer.invoke('sahayak:open-external', String(url)),
});
