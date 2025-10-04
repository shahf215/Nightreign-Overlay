(function initializeOverlayStateModule(root) {
  const namespace = (root.OverlayModules = root.OverlayModules || {});

  const labelBaseStyle = Object.freeze({
    fontPx: 12,
    labelPad: 12,
    labelH: 16,
    bgAlpha: 0.5,
  });

  const STYLE_DEFINITIONS = [
    {
      key: 'night',
      visiblePref: 'overlay_showNight',
      colorPref: 'overlay_color_night',
      defaultColor: '#ffffff',
    },
    {
      key: 'evergaol',
      visiblePref: 'overlay_showEvergaol',
      colorPref: 'overlay_color_evergaol',
      defaultColor: '#3b82f6',
    },
    {
      key: 'field-boss',
      visiblePref: 'overlay_showFieldBoss',
      colorPref: 'overlay_color_field_boss',
      defaultColor: '#ef4444',
    },
    {
      key: 'event',
      visiblePref: 'overlay_showEvent',
      colorPref: 'overlay_color_event',
      defaultColor: '#f59e0b',
    },
    {
      key: 'sorcerer-rise',
      visiblePref: 'overlay_showSorcererRise',
      colorPref: 'overlay_color_sorcerer_rise',
      defaultColor: '#a855f7',
    },
    {
      key: 'church',
      visiblePref: 'overlay_showChurches',
      colorPref: 'overlay_color_church',
      defaultColor: '#60a5fa',
    },
    {
      key: 'ruins',
      visiblePref: 'overlay_showRuins',
      colorPref: 'overlay_color_ruins',
      defaultColor: '#f97316',
    },
    {
      key: 'great-church',
      visiblePref: 'overlay_showGreatChurches',
      colorPref: 'overlay_color_great_church',
      defaultColor: '#06b6d4',
    },
    {
      key: 'township',
      visiblePref: 'overlay_showTownships',
      colorPref: 'overlay_color_township',
      defaultColor: '#84cc16',
    },
    {
      key: 'fort',
      visiblePref: 'overlay_showForts',
      colorPref: 'overlay_color_fort',
      defaultColor: '#ef4444',
    },
    {
      key: 'caravan',
      visiblePref: 'overlay_showCaravans',
      colorPref: 'overlay_color_caravan',
      defaultColor: '#f59e0b',
    },
    {
      key: 'camp',
      visiblePref: 'overlay_showCamps',
      colorPref: 'overlay_color_camp',
      defaultColor: '#8b5cf6',
    },
    {
      key: 'castle-boss',
      visiblePref: 'overlay_showCastle',
      colorPref: 'overlay_color_castle_boss',
      defaultColor: '#10b981',
    },
  ];

  const STYLE_PREF_KEY_SET = new Set();
  const STYLE_DEF_BY_KEY = STYLE_DEFINITIONS.reduce((acc, def) => {
    acc[def.key] = def;
    STYLE_PREF_KEY_SET.add(def.visiblePref);
    STYLE_PREF_KEY_SET.add(def.colorPref);
    return acc;
  }, {});

  function createDefaultStyleState() {
    const state = {};
    for (const def of STYLE_DEFINITIONS) {
      state[def.key] = { visible: true, color: def.defaultColor };
    }
    return state;
  }

  const OVERLAY_PREF_KEYS = {
    fontSize: 'overlay_fontSize',
    offsetX: 'overlay_offsetX',
    offsetY: 'overlay_offsetY',
    scale: 'overlay_scale',
  };

  const OVERLAY_PREF_KEY_SET = new Set([
    ...STYLE_PREF_KEY_SET,
    OVERLAY_PREF_KEYS.fontSize,
    OVERLAY_PREF_KEYS.offsetX,
    OVERLAY_PREF_KEYS.offsetY,
    OVERLAY_PREF_KEYS.scale,
  ]);

  const overlayPrefsState = {
    styles: createDefaultStyleState(),
    fontSize: labelBaseStyle.fontPx,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
  };

  const FALLBACK_COLOR = '#ffffff';

  function loadOverlayPrefsFromStorage() {
    try {
      const readBool = key => {
        const v = localStorage.getItem(key);
        if (v === null) return null;
        return String(v) === 'true';
      };

      const readNum = (key, fallback) => {
        const v = localStorage.getItem(key);
        if (v === null) return fallback;
        const n = Number(v);
        return Number.isFinite(n) ? n : fallback;
      };

      const readStr = (key, fallback) => {
        const v = localStorage.getItem(key);
        return v === null ? fallback : String(v);
      };

      for (const def of STYLE_DEFINITIONS) {
        const state = overlayPrefsState.styles[def.key] || {
          visible: true,
          color: def.defaultColor,
        };
        const visible = readBool(def.visiblePref);
        if (visible !== null) state.visible = visible;
        state.color = readStr(def.colorPref, state.color);
        overlayPrefsState.styles[def.key] = state;
      }

      overlayPrefsState.fontSize = readNum(OVERLAY_PREF_KEYS.fontSize, overlayPrefsState.fontSize);
      overlayPrefsState.offsetX = readNum(OVERLAY_PREF_KEYS.offsetX, overlayPrefsState.offsetX);
      overlayPrefsState.offsetY = readNum(OVERLAY_PREF_KEYS.offsetY, overlayPrefsState.offsetY);
      overlayPrefsState.scale = readNum(OVERLAY_PREF_KEYS.scale, overlayPrefsState.scale || 1);
    } catch (error) {
      console.warn('[overlay] failed to read overlay prefs from storage', error);
    }
  }

  function getStyleState(styleKey) {
    const existing = overlayPrefsState.styles[styleKey];
    if (existing) return existing;
    const def = STYLE_DEF_BY_KEY[styleKey];
    const fallback = {
      visible: true,
      color: def?.defaultColor || FALLBACK_COLOR,
    };
    overlayPrefsState.styles[styleKey] = fallback;
    return fallback;
  }

  function isStyleVisible(styleKey) {
    return getStyleState(styleKey).visible !== false;
  }

  function getStyleColor(styleKey) {
    const state = getStyleState(styleKey);
    if (state.color) return state.color;
    return STYLE_DEF_BY_KEY[styleKey]?.defaultColor || FALLBACK_COLOR;
  }

  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function stripTypePrefix(value, candidates) {
    if (!value) return value;
    let out = String(value).trim();
    for (const candidate of candidates) {
      const rx = new RegExp('^' + escapeRegExp(candidate) + '\\s*[--:]?\\s*', 'i');
      const next = out.replace(rx, '');
      if (next !== out) {
        return next.trim();
      }
    }
    return out.trim();
  }

  function wrapLabelText(text, maxLen) {
    const words = String(text).split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      if ((current.length ? current.length + 1 : 0) + word.length <= maxLen) {
        current += (current.length ? ' ' : '') + word;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  namespace.state = {
    labelBaseStyle,
    overlayPrefsState,
    OVERLAY_PREF_KEYS,
    OVERLAY_PREF_KEY_SET,
    loadOverlayPrefsFromStorage,
    isStyleVisible,
    getStyleColor,
    stripTypePrefix,
    wrapLabelText,
  };
})(typeof window !== 'undefined' ? window : globalThis);
