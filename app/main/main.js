const { app, BrowserWindow, globalShortcut, screen, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

function shouldLogDev() {
  return process.env.NODE_ENV !== 'production';
}

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
let cachedHotkeys = null;
let shortcutsSuspended = false;
let currentLocale = 'en';

function sanitizeAccelerator(acc, fallback) {
  if (!acc || typeof acc !== 'string') return fallback;
  const value = acc.trim();
  if (!value || /mouse\d*/i.test(value) || /unidentified/i.test(value) || /^dead$/i.test(value)) {
    console.warn(`[main] Invalid accelerator "${acc}". Falling back to ${fallback}.`);
    return fallback;
  }

  const MODIFIER_SET = new Set(['Ctrl', 'Shift', 'Alt', 'Meta']);
  const CANONICAL_TOKENS = Object.freeze({
    control: 'Ctrl',
    ctrl: 'Ctrl',
    shift: 'Shift',
    alt: 'Alt',
    option: 'Alt',
    altgr: 'Alt',
    meta: 'Meta',
    super: 'Meta',
    command: 'Meta',
    cmd: 'Meta',
    win: 'Meta',
    windows: 'Meta',
    escape: 'Esc',
    esc: 'Esc',
    space: 'Space',
    return: 'Enter',
    enter: 'Enter',
    tab: 'Tab',
    backspace: 'Backspace',
    delete: 'Delete',
    arrowup: 'ArrowUp',
    arrowdown: 'ArrowDown',
    arrowleft: 'ArrowLeft',
    arrowright: 'ArrowRight',
    plus: 'Plus',
    add: 'Plus',
    minus: 'Minus',
    subtract: 'Minus',
    pageup: 'PageUp',
    pagedown: 'PageDown',
    home: 'Home',
    end: 'End',
  });

  const normalize = token => {
    if (!token) return null;
    const trimmed = token.trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    const canonical = CANONICAL_TOKENS[lower];
    if (canonical) return canonical;
    if (lower.startsWith('ctrl')) return 'Ctrl';
    if (lower.startsWith('shift')) return 'Shift';
    if (lower.startsWith('alt')) return 'Alt';
    if (
      lower.startsWith('meta') ||
      lower.startsWith('super') ||
      lower.startsWith('command') ||
      lower.startsWith('cmd') ||
      lower.startsWith('win')
    ) {
      return 'Meta';
    }
    if (/^f\d{1,2}$/.test(lower)) return lower.toUpperCase();
    if (lower.length === 1) return lower.toUpperCase();
    if (lower.startsWith('numpad') && lower.length > 6) {
      const first = lower.charAt(6);
      const rest = lower.slice(7);
      return 'Numpad' + first.toUpperCase() + rest;
    }
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  const tokens = value.split('+').map(normalize).filter(Boolean);
  if (!tokens.length) return fallback;
  const seen = new Set();
  const normalised = [];
  let hasNonModifier = false;
  tokens.forEach(tok => {
    if (seen.has(tok)) return;
    seen.add(tok);
    normalised.push(tok);
    if (!MODIFIER_SET.has(tok)) hasNonModifier = true;
  });
  if (!normalised.length || !hasNonModifier) {
    console.warn(`[main] Accelerator "${acc}" is modifier-only. Falling back to ${fallback}.`);
    return fallback;
  }
  return normalised.join('+');
}
function normalizeHotkeyMap(map = {}) {
  return {
    toggleSeedFinder: sanitizeAccelerator(map.toggleSeedFinder, 'F7'),
    sendToOverlay: sanitizeAccelerator(map.sendToOverlay, 'F8'),
    toggleOverlay: sanitizeAccelerator(map.toggleOverlay, 'F9'),
    resetOverlay: sanitizeAccelerator(map.resetOverlay, 'F10'),
  };
}

function loadHotkeysRaw() {
  const cfgPath = path.join(__dirname, '..', '..', 'config', 'hotkeys.json');
  try {
    const raw = fs.readFileSync(cfgPath, 'utf-8');
    const data = JSON.parse(raw);
    return {
      toggleSeedFinder: data.toggleSeedFinder || 'F7',
      sendToOverlay: data.sendToOverlay || 'F8',
      toggleOverlay: data.toggleOverlay || 'F9',
      resetOverlay: data.resetOverlay || 'F10',
    };
  } catch (err) {
    console.warn(
      `[main] Failed to load hotkeys configuration from ${cfgPath}, using defaults`,
      err
    );
    return {
      toggleSeedFinder: 'F7',
      sendToOverlay: 'F8',
      toggleOverlay: 'F9',
      resetOverlay: 'F10',
    };
  }
}

function loadHotkeys() {
  const raw = loadHotkeysRaw();
  return normalizeHotkeyMap(raw);
}

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

  overlayWin.loadFile(path.join(__dirname, '..', '..', 'public', 'overlay', 'index.html'));

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

      try {
        wc.send('overlay:locale', currentLocale);
      } catch (error) {
        if (shouldLogDev()) {
          console.warn('[main] Failed to push locale to overlay window', error);
        }
      }
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
    height: 870,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  seedWin.loadFile(path.join(__dirname, '..', '..', 'public', 'finder', 'index.html'));

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
  const raw = loadHotkeysRaw();
  const sanitized = normalizeHotkeyMap(raw);
  const cfgPath = path.join(__dirname, '..', '..', 'config', 'hotkeys.json');
  if (
    raw.toggleSeedFinder !== sanitized.toggleSeedFinder ||
    raw.sendToOverlay !== sanitized.sendToOverlay ||
    raw.toggleOverlay !== sanitized.toggleOverlay ||
    raw.resetOverlay !== sanitized.resetOverlay
  ) {
    try {
      fs.writeFileSync(cfgPath, JSON.stringify(sanitized, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[main] Failed to normalise hotkeys config', err);
    }
  }
  cachedHotkeys = sanitized;
  if (shortcutsSuspended) return;
  globalShortcut.unregisterAll();

  const ACTION_EXECUTORS = {
    toggleSeedFinder() {
      if (seedWin) {
        if (seedWin.isVisible()) seedWin.hide();
        else seedWin.show();
      } else {
        createFinder();
      }
    },
    sendToOverlay() {
      send(seedWin, 'finder:request-active-seed');
    },
    toggleOverlay() {
      if (!overlayWin) return;
      if (overlayWin.isVisible()) overlayWin.hide();
      else {
        overlayWin.showInactive();
        overlayWin.setAlwaysOnTop(true, 'screen-saver');
      }
    },
    resetOverlay() {
      send(overlayWin, 'overlay:reset');
    },
  };

  Object.entries({
    toggleSeedFinder: sanitized.toggleSeedFinder,
    sendToOverlay: sanitized.sendToOverlay,
    toggleOverlay: sanitized.toggleOverlay,
    resetOverlay: sanitized.resetOverlay,
  }).forEach(([action, accelerator]) => {
    try {
      globalShortcut.register(accelerator, () => {
        try {
          ACTION_EXECUTORS[action]();
        } catch (e) {
          console.warn(`[main] Hotkey action failed: ${action}`, e);
        }
      });
    } catch (err) {
      console.warn(`[main] Failed to register shortcut ${accelerator} for ${action}`, err);
    }
  });
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

ipcMain.on('hotkeys:suspend', (_e, flag) => {
  const shouldSuspend = Boolean(flag);
  if (shortcutsSuspended === shouldSuspend) return;
  shortcutsSuspended = shouldSuspend;
  if (shortcutsSuspended) {
    globalShortcut.unregisterAll();
  } else {
    registerShortcuts();
  }
});

ipcMain.on('hotkeys:save', (_e, cfg) => {
  const cfgPath = path.join(__dirname, '..', '..', 'config', 'hotkeys.json');
  const sanitized = normalizeHotkeyMap(cfg || {});
  try {
    fs.writeFileSync(cfgPath, JSON.stringify(sanitized, null, 2), 'utf-8');

    registerShortcuts();
  } catch (err) {
    console.error('Failed to save hotkeys config', err);
  }
});

ipcMain.on('locale:changed', (_e, code) => {
  if (typeof code === 'string' && code.trim()) {
    currentLocale = code.trim();
    send(overlayWin, 'overlay:locale', currentLocale);
  }
});

ipcMain.handle('hotkeys:request', () => {
  return cachedHotkeys || loadHotkeys();
});

async function bootstrap() {
  try {
    await app.whenReady();
  } catch (error) {
    console.error('[main] Electron failed to initialise', error);
    app.quit();
    return;
  }

  const display = screen.getPrimaryDisplay();
  createOverlay(display);
  createFinder();
  registerShortcuts();

  screen.on('display-added', reattachToPrimary);
  screen.on('display-removed', reattachToPrimary);
  screen.on('display-metrics-changed', reattachToPrimary);
}

bootstrap();

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => globalShortcut.unregisterAll());
