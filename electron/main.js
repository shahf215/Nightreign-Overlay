const { app, BrowserWindow, globalShortcut, screen, ipcMain } = require('electron');
const path = require('path');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (seedWin) {
      if (seedWin.isMinimized()) seedWin.restore();
      seedWin.focus();
    }
  });
}

let overlayWin = null;
let seedWin = null;
let clickThrough = true;

function createOverlay(display) {
  const { x, y, width, height } = display.bounds;

  overlayWin = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    focusable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    type: process.platform === 'win32' ? 'toolbar' : 'panel',
    useContentSize: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      zoomFactor: 1,
    },
  });

  overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWin.setAlwaysOnTop(true, 'screen-saver');
  overlayWin.setIgnoreMouseEvents(clickThrough, { forward: true });

  overlayWin.loadFile(path.join(__dirname, '../renderer/overlay.html'));

  overlayWin.webContents.on('did-finish-load', event => {
    const wc = event.sender;
    if (!wc || wc.isDestroyed()) return;

    const thisWin = BrowserWindow.fromWebContents(wc);
    if (!thisWin || thisWin.isDestroyed()) return;

    try {
      wc.setZoomFactor(1);
      wc.setVisualZoomLevelLimits(1, 1);

      const d = screen.getDisplayMatching(thisWin.getBounds());
      wc.send('display-info', {
        bounds: d.bounds,
        scaleFactor: d.scaleFactor,
      });
    } catch (error) {
      console.error('Error in did-finish-load handler:', error);
    }
  });

  overlayWin.on('closed', () => {
    overlayWin = null;
  });
}

function createFinder() {
  seedWin = new BrowserWindow({
    width: 1080,
    height: 845,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  seedWin.loadFile(path.join(__dirname, '../renderer/seedfinder.html'));

  seedWin.on('closed', () => {
    seedWin = null;
    if (overlayWin && !overlayWin.isDestroyed()) overlayWin.close();
    overlayWin = null;
    app.quit();
  });
}

function send(win, ch, payload) {
  if (win && !win.isDestroyed()) {
    try {
      win.webContents.send(ch, payload);
    } catch (error) {
      console.error('Error sending message to window:', error);
    }
  }
}

function registerShortcuts() {
  globalShortcut.register('F8', () => {
    if (seedWin) {
      if (seedWin.isVisible()) {
        seedWin.hide();
      } else {
        seedWin.show();
      }
    } else {
      createFinder();
    }
  });

  globalShortcut.register('F9', () => {
    if (!overlayWin) return;
    if (overlayWin.isVisible()) {
      overlayWin.hide();
    } else {
      overlayWin.showInactive();
      overlayWin.setAlwaysOnTop(true, 'screen-saver');
    }
  });

  globalShortcut.register('F10', () => send(overlayWin, 'overlay:reset'));
}

function reattachToPrimary() {
  const d = screen.getPrimaryDisplay();
  if (overlayWin && !overlayWin.isDestroyed()) {
    overlayWin.destroy();
  }
  createOverlay(d);
}

ipcMain.on('overlay:toggle-overlay', () => {
  if (!overlayWin || overlayWin.isDestroyed()) return;
  if (overlayWin.isVisible()) {
    overlayWin.hide();
  } else {
    overlayWin.showInactive();
    overlayWin.setAlwaysOnTop(true, 'screen-saver');
  }
});

ipcMain.on('overlay:hide-overlay', () => {
  if (overlayWin && !overlayWin.isDestroyed() && overlayWin.isVisible()) {
    overlayWin.hide();
  }
});

ipcMain.on('seed:selected', (_e, payload) => {
  send(overlayWin, 'overlay:seed-selected', payload);
});

ipcMain.on('overlay:reset', () => {
  send(overlayWin, 'overlay:reset');
});

app.whenReady().then(() => {
  const display = screen.getPrimaryDisplay();
  createOverlay(display);
  createFinder();
  registerShortcuts();

  screen.on('display-added', reattachToPrimary);
  screen.on('display-removed', reattachToPrimary);
  screen.on('display-metrics-changed', reattachToPrimary);
});

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => globalShortcut.unregisterAll());
