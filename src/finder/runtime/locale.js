(() => {
  const runtime = (window.SeedfinderRuntime = window.SeedfinderRuntime || {});

  function shouldLogDev() {
    if (typeof localStorage === 'undefined') return false;
    try {
      return Boolean(localStorage.getItem('dev'));
    } catch {
      return false;
    }
  }

  function createLocaleController({ state, data, view }) {
    if (!state || !data || !view) {
      throw new Error('[finder:locale] Missing dependencies');
    }

    async function fetchLocale(code) {
      const url = `../locales/${code}.json`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (error) {
        console.warn(`Failed to load locale ${code} (${url})`, error);
        return null;
      }
    }

    async function loadLocale(code) {
      let payload = await fetchLocale(code);
      if (!payload && code !== 'en') {
        payload = await fetchLocale('en');
        code = 'en';
      }
      payload = payload || {};
      state.setLocale(code);
      state.setTexts(payload);
      localStorage.setItem('locale', code);

      const ensure =
        (typeof runtime.ensureSeedfinderI18N === 'function' && runtime.ensureSeedfinderI18N) ||
        (window.SeedfinderI18N?.init && window.SeedfinderI18N.init.bind(window.SeedfinderI18N));
      if (ensure) {
        try {
          await ensure(code);
        } catch (error) {
          if (shouldLogDev()) {
            console.warn('[finder:locale] Failed to ensure domain locale', error);
          }
        }
      }

      try {
        window.app?.seed?.setLocale?.(code);
      } catch (error) {
        if (shouldLogDev()) {
          console.warn('[finder:locale] Failed to notify main process of locale change', error);
        }
      }

      view.updateTexts();

      if (Array.isArray(state.current.mapTypeList) && state.current.mapTypeList.length) {
        view.buildMapButtons(type => {
          const selectMap = runtime.selectionInstance?.selectMap;
          if (typeof selectMap === 'function') {
            try {
              selectMap.call(runtime.selectionInstance, type);
            } catch (error) {
              if (shouldLogDev()) {
                console.warn('[finder:locale] Failed to select map type', error);
              }
            }
          }
        });
      }

      view.updateStatus?.();
      view.updateCandidatesList?.();
      view.updateSendButtonState?.();
      if (!state.current.activeMapType) {
        view.showShiftingEarthThumbs();
      }
    }

    function getSavedLocale() {
      const saved = localStorage.getItem('locale');
      if (saved && data.supportedLocales?.[saved]) {
        return saved;
      }
      return 'en';
    }

    async function init() {
      view.buildLocalePicker(async localeCode => {
        try {
          await loadLocale(localeCode);
        } catch (error) {
          console.error('[finder] Failed to switch locale', error);
        }
      });
      const defaultLocale = getSavedLocale();
      view.setLocaleSelectValue(defaultLocale);
      await loadLocale(defaultLocale);
    }

    return {
      init,
      loadLocale,
    };
  }

  runtime.createLocaleController = createLocaleController;
})();
