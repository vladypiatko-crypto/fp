// Electron preload: the few desktop things the game may ask for (see main.js and www/js/update.js).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('quackDesktop', {
  // download the newest QuackAttack-Windows.exe, swap it in over this one and restart into it
  update: url => ipcRenderer.invoke('quack-update', url),
  onProgress: fn => ipcRenderer.on('quack-update-progress', (e, p) => fn(p)),
});
