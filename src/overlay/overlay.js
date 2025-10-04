(() => {
  'use strict';

  if (window.OverlayRuntime?.ensureStarted) {
    window.OverlayRuntime.ensureStarted();
    console.warn(
      '[overlay] Legacy overlay.js entrypoint is deprecated. Runtime now boots via overlay/runtime/index.js.'
    );
  } else if (window.OverlayRuntime?.start) {
    window.OverlayRuntime.start();
  } else {
    console.error(
      '[overlay] Overlay runtime not initialized. Ensure overlay/runtime scripts load first.'
    );
  }
})();
