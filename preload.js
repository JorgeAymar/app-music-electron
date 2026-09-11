const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  searchMusic: (query) => ipcRenderer.invoke('search-music', query),
});
