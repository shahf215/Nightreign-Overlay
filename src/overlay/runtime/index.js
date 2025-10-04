(() => {
  const runtime = (window.OverlayRuntime = window.OverlayRuntime || {});

  const listeners = [];
  let overlayInstance = null;

  const overlayLocaleState = { locale: null, pending: null };

  const normalizeLocale = value =>
    typeof value === 'string' && value.trim() ? value.trim() : 'en';

  async function ensureOverlayI18N(locale) {
    const target = normalizeLocale(locale);
    if (overlayLocaleState.locale === target) return;

    if (overlayLocaleState.pending) await overlayLocaleState.pending;
    if (overlayLocaleState.locale === target) return;

    const init = window.OverlayI18N?.init;
    if (typeof init !== 'function') {
      overlayLocaleState.locale = target;
      return;
    }

    const load = async next => {
      const norm = normalizeLocale(next);
      try {
        await init.call(window.OverlayI18N, norm);
        overlayLocaleState.locale = norm;
        return true;
      } catch (err) {
        console.warn(`[overlay] i18n init failed for ${norm}`, err);
        return false;
      }
    };

    overlayLocaleState.pending = (async () => {
      if (!(await load(target)) && target !== 'en') await load('en');
    })();

    await overlayLocaleState.pending;
    overlayLocaleState.pending = null;
  }

  function registerWindowListener(type, handler, options) {
    window.addEventListener(type, handler, options);
    listeners.push(() => window.removeEventListener(type, handler, options));
  }

  function registerTeardown(fn) {
    if (typeof fn === 'function') {
      listeners.push(fn);
    }
  }

  async function start() {
    if (overlayInstance) {
      return overlayInstance;
    }

    const modules = window.OverlayModules || {};
    if (!modules.state || !modules.data) {
      console.error(
        '[overlay] Missing state/data modules. Ensure overlay/modules/*.js are loaded first.'
      );
      return null;
    }

    if (!runtime.seedDisplay || typeof runtime.seedDisplay.buildLabelDescriptors !== 'function') {
      console.error('[overlay] Missing runtime seed display module.');
      return null;
    }

    if (!runtime.renderer || typeof runtime.renderer.renderDescriptors !== 'function') {
      console.error('[overlay] Missing runtime renderer module.');
      return null;
    }

    if (!runtime.uiState || typeof runtime.uiState.deriveUiMetrics !== 'function') {
      console.error('[overlay] Missing runtime UI state module.');
      return null;
    }

    await ensureOverlayI18N(localStorage.getItem('locale'));

    const canvas = document.getElementById('c');
    if (!canvas) {
      console.error("[overlay] <canvas id='c'> not found.");
      return null;
    }

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) {
      console.error('[overlay] Unable to acquire 2D context.');
      return null;
    }

    const { getPanelRect, dprSetupCanvas, uvToScreen, getUiScale, getSurfaceRect } = window;
    if (!dprSetupCanvas || !getPanelRect || !uvToScreen || !getUiScale || !getSurfaceRect) {
      console.error('[overlay] Required UV runtime helpers missing.');
      return null;
    }

    const {
      labelBaseStyle,
      overlayPrefsState,
      OVERLAY_PREF_KEY_SET,
      loadOverlayPrefsFromStorage,
      isStyleVisible,
      getStyleColor,
      stripTypePrefix,
      wrapLabelText,
    } = modules.state;

    const {
      SORCERERS_RISE_PREFIX,
      loadPoiData,
      getPoiList,
      getPoiRecord,
      loadSeedsForNightlord,
      resolveNightlordForSeedId,
      findSeed,
      getActiveSeed,
      setActiveSeed,
      resetActiveSeed,
    } = modules.data;

    let panelRectPx = null;

    function render() {
      dprSetupCanvas(canvas, ctx);

      const width = window.innerWidth;
      const height = window.innerHeight;
      const surfaceRectPx = getSurfaceRect(width, height);

      panelRectPx = getPanelRect(surfaceRectPx);
      const scale = getUiScale(surfaceRectPx);

      loadOverlayPrefsFromStorage();
      const ui = runtime.uiState.deriveUiMetrics({
        overlayPrefs: overlayPrefsState,
        labelBaseStyle,
        scale,
      });

      runtime.renderer.clearCanvas(ctx, width, height);

      const poiList = getPoiList();
      const active = getActiveSeed();
      if (!active || !active.seedData || !poiList.length) return;
      const seedData = active.seedData;

      const descriptors = runtime.seedDisplay.buildLabelDescriptors(seedData, {
        stripTypePrefix,
        SORCERERS_RISE_PREFIX,
      });

      runtime.renderer.renderDescriptors(ctx, descriptors, {
        panelRect: panelRectPx,
        ui,
        getPoiRecord,
        uvToScreen,
        isStyleVisible,
        getStyleColor,
        wrapLabelText,
        globalScale: overlayPrefsState.scale || 1,
      });
    }

    registerWindowListener('storage', event => {
      if (!event.key || !OVERLAY_PREF_KEY_SET.has(event.key)) return;
      loadOverlayPrefsFromStorage();
      render();
    });

    registerWindowListener('resize', render);
    registerWindowListener('seed-changed', render);

    const unsubscribeReset = window.app?.overlay?.onReset?.(() => {
      resetActiveSeed();
      panelRectPx = null;
      render();
    });

    const unsubscribeSeed = window.app?.overlay?.onSeedSelected?.(async payload => {
      try {
        if (!payload) {
          setActiveSeed(null);
        } else if (payload.seedData || (payload && payload['pat' + 'tern'])) {
          const incoming = payload.seedData || payload['pat' + 'tern'];
          setActiveSeed({ seedData: incoming });
        } else if (payload.seed && (payload.nightlord || payload.seed.nightlord)) {
          const nightlord = payload.nightlord || payload.seed.nightlord;
          const seedList = await loadSeedsForNightlord(nightlord);
          const match = findSeed(seedList, payload.seed_id || payload.seed?.seed_id);
          setActiveSeed({ seedData: match || payload.seed });
        } else if (payload.slots || payload.seed_id) {
          let nightlord = payload.nightlord || payload.seed?.nightlord || null;
          if (!nightlord) {
            nightlord = resolveNightlordForSeedId(payload.seed_id || payload.seed?.seed_id);
          }
          if (nightlord) {
            const seedList = await loadSeedsForNightlord(nightlord);
            const match = findSeed(seedList, payload.seed_id || payload.seed?.seed_id);
            setActiveSeed({ seedData: match || payload });
          } else {
            setActiveSeed({ seedData: payload });
          }
        } else {
          setActiveSeed({ seedData: payload });
        }
      } catch (error) {
        console.error('[overlay] Error normalizing seed payload:', error, payload);
        setActiveSeed(null);
      }
      render();
    });

    const unsubscribeLocale = window.app?.overlay?.onLocale?.(async code => {
      await ensureOverlayI18N(code);
      render();
    });

    registerTeardown(() => unsubscribeReset?.());
    registerTeardown(() => unsubscribeSeed?.());
    registerTeardown(() => unsubscribeLocale?.());

    registerWindowListener('beforeunload', () => {
      unsubscribeReset?.();
      unsubscribeSeed?.();
    });

    const Loop = {
      emit(eventName) {
        if (eventName === 'HIDE_OVERLAY') {
          window.app?.overlay?.hideOverlay?.();
        }
        if (eventName === 'TOGGLE_OVERLAY') {
          window.app?.overlay?.toggleOverlay?.();
        }
      },
    };

    if (window.GamepadInput?.start) {
      window.GamepadInput.start(Loop);
      registerTeardown(() => window.GamepadInput?.stop?.());
    }

    try {
      await loadPoiData();
      render();
    } catch (error) {
      console.error('[overlay] Failed to load data:', error);
    }

    overlayInstance = {
      render,
      teardown() {
        while (listeners.length) {
          const dispose = listeners.pop();
          try {
            dispose();
          } catch (error) {
            console.warn('[overlay] Failed to dispose listener', error);
          }
        }
        overlayInstance = null;
      },
    };

    return overlayInstance;
  }

  function ensureStarted() {
    if (document.readyState === 'loading') {
      document.addEventListener(
        'DOMContentLoaded',
        () => {
          start();
        },
        { once: true }
      );
    } else {
      start();
    }
  }

  runtime.start = start;
  runtime.ensureStarted = ensureStarted;

  ensureStarted();
})();
