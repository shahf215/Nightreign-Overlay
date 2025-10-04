(() => {
  const runtime = (window.SeedfinderRuntime = window.SeedfinderRuntime || {});

  function createEventController({ dom, selection, view }) {
    if (!dom || !selection || !view) {
      throw new Error('[finder:events] Missing dependencies');
    }

    const disposers = [];

    function addListener(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      disposers.push(() => target.removeEventListener(type, handler, options));
    }

    function bind() {
      if (dom.resetBtn) {
        addListener(dom.resetBtn, 'click', () => selection.resetFinderState());
      }
      if (dom.sendBtn) {
        addListener(dom.sendBtn, 'click', () => selection.dispatchSeedToOverlay());
      }
      addListener(window, 'resize', () => view.recalcMapLayout());
    }

    function teardown() {
      while (disposers.length) {
        const dispose = disposers.pop();
        try {
          dispose();
        } catch (error) {
          console.warn('[finder:events] Failed to remove listener', error);
        }
      }
    }

    return {
      bind,
      teardown,
    };
  }

  runtime.createEventController = createEventController;
})();
