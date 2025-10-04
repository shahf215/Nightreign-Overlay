class GamepadInput {
  static loop = null;
  static polling = false;
  static rafId = null;
  static lastButtons = new Map();
  static profiles = new Map();

  static detectBrand(gp) {
    const id = (gp.id || '').toLowerCase();

    const isPS =
      id.includes('054c') ||
      id.includes('dualsense') ||
      id.includes('dualshock') ||
      id.includes('playstation') ||
      id.includes('sony') ||
      (Array.isArray(gp.buttons) && gp.buttons.length >= 18 && gp.buttons[17] !== undefined);

    const isXbox =
      id.includes('045e') ||
      id.includes('xbox') ||
      id.includes('microsoft') ||
      id.includes('xinput') ||
      id.includes('controller (xbox');

    if (isPS && !isXbox) return 'ps';
    if (isXbox && !isPS) return 'xbox';

    if (id.includes('054c')) return 'ps';
    if (id.includes('045e')) return 'xbox';

    return 'unknown';
  }

  static brandFor(gp) {
    const cached = this.profiles.get(gp.index);
    if (cached) return cached;
    const brand = this.detectBrand(gp);
    this.profiles.set(gp.index, brand);
    return brand;
  }

  static start(loop) {
    this.loop = loop;
    this.lastButtons.clear?.();
    this.profiles.clear?.();
    this.polling = true;

    const tick = () => {
      if (!this.polling) return;
      this.pollGamepads();
      this.rafId = requestAnimationFrame(tick);
    };
    tick();
  }

  static stop() {
    this.polling = false;
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.lastButtons.clear?.();
    this.profiles.clear?.();
  }

  static justPressed(prev, curr, i) {
    return !!curr[i] && !prev[i];
  }

  static pollGamepads() {
    const pads = navigator.getGamepads?.() || [];
    for (const gp of pads) {
      if (!gp) continue;

      const prev = this.lastButtons.get(gp.index) || [];
      const curr = gp.buttons.map(b => !!b?.pressed);
      const brand = this.brandFor(gp);

      if (brand === 'ps' && this.justPressed(prev, curr, 17)) {
        this.loop?.emit?.('TOGGLE_OVERLAY');
      }

      if (brand === 'xbox' && this.justPressed(prev, curr, 8)) {
        this.loop?.emit?.('TOGGLE_OVERLAY');
      }

      if (
        (brand === 'ps' || brand === 'xbox') &&
        (this.justPressed(prev, curr, 1) ||
          this.justPressed(prev, curr, 4) ||
          this.justPressed(prev, curr, 5) ||
          this.justPressed(prev, curr, 9))
      ) {
        this.loop?.emit?.('HIDE_OVERLAY');
      }

      this.lastButtons.set(gp.index, curr);
    }
  }
}

window.GamepadInput = GamepadInput;
