(() => {
  const runtime = (window.SeedfinderRuntime = window.SeedfinderRuntime || {});

  const defaultHotkeys = {
    'Toggle Seed Finder': 'F7',
    'Send To Overlay': 'F8',
    'Toggle Overlay': 'F9',
    'Reset Overlay': 'F10',
  };

  const INVALID_ACCELERATOR = /mouse\d*/i;
  const MODIFIER_SYNONYMS = {
    CONTROL: 'Ctrl',
    CTRL: 'Ctrl',
    SHIFT: 'Shift',
    ALT: 'Alt',
    OPTION: 'Alt',
    META: 'Meta',
    SUPER: 'Meta',
    COMMAND: 'Meta',
    CMD: 'Meta',
    WIN: 'Meta',
  };
  const SPECIAL_TOKENS = {
    ESCAPE: 'Esc',
    ESC: 'Esc',
    SPACE: 'Space',
    RETURN: 'Enter',
    ENTER: 'Enter',
    TAB: 'Tab',
    BACKSPACE: 'Backspace',
    DELETE: 'Delete',
    ARROWUP: 'ArrowUp',
    ARROWDOWN: 'ArrowDown',
    ARROWLEFT: 'ArrowLeft',
    ARROWRIGHT: 'ArrowRight',
    PLUS: 'Plus',
    MINUS: 'Minus',
    ADD: 'Plus',
    SUBTRACT: 'Minus',
    PAGEUP: 'PageUp',
    PAGEDOWN: 'PageDown',
    HOME: 'Home',
    END: 'End',
  };
  const MODIFIER_SET = new Set(['Ctrl', 'Shift', 'Alt', 'Meta']);

  function normalizeToken(token) {
    if (!token) return null;
    const upper = token.trim().toUpperCase();
    if (!upper) return null;
    if (MODIFIER_SYNONYMS[upper]) return MODIFIER_SYNONYMS[upper];
    if (SPECIAL_TOKENS[upper]) return SPECIAL_TOKENS[upper];
    if (/^CTRL/.test(upper)) return 'Ctrl';
    if (/^SHIFT/.test(upper)) return 'Shift';
    if (/^ALT/.test(upper)) return 'Alt';
    if (/^(META|SUPER|COMMAND|CMD|WIN)/.test(upper)) return 'Meta';
    if (/^F\d{1,2}$/.test(upper)) return upper;
    if (upper.length === 1) return upper;
    if (upper.startsWith('NUMPAD') && upper.length > 6) {
      return 'Numpad' + upper.slice(6).charAt(0) + upper.slice(7).toLowerCase();
    }
    return upper.charAt(0) + upper.slice(1).toLowerCase();
  }

  function sanitizeAccelerator(value, fallback) {
    if (!value || typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    if (
      !trimmed ||
      trimmed === 'Press keys...' ||
      INVALID_ACCELERATOR.test(trimmed) ||
      /unidentified/i.test(trimmed) ||
      /^dead$/i.test(trimmed)
    ) {
      return fallback;
    }
    const tokens = trimmed
      .split('+')
      .map(part => normalizeToken(part))
      .filter(Boolean);
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
    if (!normalised.length || !hasNonModifier) return fallback;
    return normalised.join('+');
  }

  function comboFromEvent(ev) {
    const tokens = [];
    if (ev.ctrlKey) tokens.push('Ctrl');
    if (ev.altKey) tokens.push('Alt');
    if (ev.shiftKey) tokens.push('Shift');
    if (ev.metaKey) tokens.push('Meta');

    let keyName = ev.key;
    if (keyName === ' ') keyName = 'Space';
    if (keyName === '+') keyName = 'Plus';
    if (keyName === '-') keyName = 'Minus';

    const keyToken = normalizeToken(keyName);
    if (keyToken && !MODIFIER_SET.has(keyToken)) {
      tokens.push(keyToken);
    } else if (!tokens.length && keyToken) {
      tokens.push(keyToken);
    }

    return tokens.join('+');
  }

  runtime.keymap = {
    defaultHotkeys,
    MODIFIER_SET,
    normalizeToken,
    sanitizeAccelerator,
    comboFromEvent,
  };
})();
