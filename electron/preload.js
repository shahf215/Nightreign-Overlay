const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('seedAPI', {
  sendSelected: (p) => ipcRenderer.send('seed:selected', p) });
contextBridge.exposeInMainWorld('overlayAPI', {
  onSetHardcoded: (h) => { 
    const f = () => h?.(); ipcRenderer.on('overlay:set-hardcoded', f); 
    return () => ipcRenderer.removeListener('overlay:set-hardcoded', f); 
    },
  onReset: (h) => { 
    const f = () => h?.(); ipcRenderer.on('overlay:reset', f); 
    return () => ipcRenderer.removeListener('overlay:reset', f); 
  },
  onSeedSelected: (h) => { 
    const f = (_e, p) => h?.(p); ipcRenderer.on('overlay:seed-selected', f); 
    return () => ipcRenderer.removeListener('overlay:seed-selected', f); 
  },
  onToggleDebug: (h) => { 
    const f = () => h?.(); ipcRenderer.on('overlay:toggle-debug', f); 
    return () => ipcRenderer.removeListener('overlay:toggle-debug', f); 
  },
  onClickThroughChanged: (h) => { 
    const f = (_e, on) => h?.(on); ipcRenderer.on('overlay:clickThroughChanged', f); 
    return () => ipcRenderer.removeListener('overlay:clickThroughChanged', f); 
  },
  onToggleOverlay: (h) => { 
    const f = () => h?.(); ipcRenderer.on('overlay:toggle-overlay', f); 
    return () => ipcRenderer.removeListener('overlay:toggle-overlay', f); 
  }
});
contextBridge.exposeInMainWorld('electronAPI', {
  overlay: {
    toggleOverlay: () => ipcRenderer.send('overlay:toggle-overlay'),
    hideOverlay: () => ipcRenderer.send('overlay:hide-overlay'),
    reset: () => ipcRenderer.send('overlay:reset')
  }
});
