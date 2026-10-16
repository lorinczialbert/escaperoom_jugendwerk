const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  electron: true,
  submitCode: (code) => ipcRenderer.invoke('submit-code', code),
  gm: (payload) => ipcRenderer.invoke('gm', payload),
  getState: () => ipcRenderer.invoke('get-state'),
  onState: (cb) => ipcRenderer.on('state', (_e, s) => cb(s)),
});
