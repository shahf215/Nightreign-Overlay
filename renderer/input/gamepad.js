class GamepadInput {
  static start(loop) {
    this.loop = loop;
    this.lastButtons = new Map();
    this.polling = true;
    requestAnimationFrame(this.pollGamepads.bind(this));
  }

  static pollGamepads() {
    if (!this.polling) return;

    const pads = navigator.getGamepads?.() || [];
    for (const gp of pads) {
      if (!gp) continue;

      const prev = this.lastButtons.get(gp.index) || [];
      const curr = gp.buttons.map(b => !!b?.pressed);

      if (gp.mapping === 'standard' && curr[17] && !prev[17]) {
        this.loop.emit('TOGGLE_OVERLAY');
      }

      if (
        gp.mapping === 'standard' &&
        ((curr[1] && !prev[1]) ||
          (curr[4] && !prev[4]) ||
          (curr[5] && !prev[5]) ||
          (curr[9] && !prev[9]))
      ) {
        this.loop.emit('HIDE_OVERLAY');
      }

      this.lastButtons.set(gp.index, curr);
    }

    requestAnimationFrame(this.pollGamepads.bind(this));
  }

  static stop() {
    this.polling = false;
  }
}

window.GamepadInput = GamepadInput;
