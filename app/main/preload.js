const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('app', {
  seed: {
    sendSelected: payload => ipcRenderer.send('seed:selected', payload),
    setLocale: code => ipcRenderer.send('locale:changed', code),
  },
  overlay: {
    onReset: handler => {
      const listener = () => handler?.();
      ipcRenderer.on('overlay:reset', listener);
      return () => ipcRenderer.removeListener('overlay:reset', listener);
    },
    onSeedSelected: handler => {
      const listener = (_event, payload) => handler?.(payload);
      ipcRenderer.on('overlay:seed-selected', listener);
      return () => ipcRenderer.removeListener('overlay:seed-selected', listener);
    },
    onToggleOverlay: handler => {
      const listener = () => handler?.();
      ipcRenderer.on('overlay:toggle-overlay', listener);
      return () => ipcRenderer.removeListener('overlay:toggle-overlay', listener);
    },
    onLocale: handler => {
      const listener = (_event, code) => handler?.(code);
      ipcRenderer.on('overlay:locale', listener);
      return () => ipcRenderer.removeListener('overlay:locale', listener);
    },
    toggleOverlay: () => ipcRenderer.send('overlay:toggle-overlay'),
    hideOverlay: () => ipcRenderer.send('overlay:hide-overlay'),
    reset: () => ipcRenderer.send('overlay:reset'),
  },
  hotkeys: {
    save: config => ipcRenderer.send('hotkeys:save', config),
    request: () => ipcRenderer.invoke('hotkeys:request'),
    suspend: flag => ipcRenderer.send('hotkeys:suspend', flag),
  },
  finder: {
    onRequestActiveSeed: handler => {
      const listener = () => handler?.();
      ipcRenderer.on('finder:request-active-seed', listener);
      return () => ipcRenderer.removeListener('finder:request-active-seed', listener);
    },
  },
});
