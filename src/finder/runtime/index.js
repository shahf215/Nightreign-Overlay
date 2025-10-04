(() => {
  const runtime = (window.SeedfinderRuntime = window.SeedfinderRuntime || {});

  let instance = null;

  const finderLocaleState = { locale: null, pending: null };

  const normalizeLocale = value =>
    typeof value === 'string' && value.trim() ? value.trim() : 'en';

  async function ensureSeedfinderI18N(locale) {
    const target = normalizeLocale(locale);
    if (finderLocaleState.locale === target) return;

    if (finderLocaleState.pending) await finderLocaleState.pending;
    if (finderLocaleState.locale === target) return;

    const init = window.SeedfinderI18N?.init;
    if (typeof init !== 'function') {
      finderLocaleState.locale = target;
      return;
    }

    const load = async next => {
      const norm = normalizeLocale(next);
      try {
        await init.call(window.SeedfinderI18N, norm);
        finderLocaleState.locale = norm;
        return true;
      } catch (err) {
        console.warn(`[finder] i18n init failed for ${norm}`, err);
        return false;
      }
    };

    finderLocaleState.pending = (async () => {
      if (!(await load(target)) && target !== 'en') await load('en');
    })();

    await finderLocaleState.pending;
    finderLocaleState.pending = null;
  }

  function requireModules() {
    const Seedfinder = window.Seedfinder || {};
    if (!Seedfinder.data || !Seedfinder.state) {
      console.error('[finder] Missing data/state modules. Ensure finder/modules/*.js load first.');
      return null;
    }
    if (!runtime.dom?.collect) {
      console.error('[finder] Runtime dom module not initialised.');
      return null;
    }
    if (
      !runtime.createView ||
      !runtime.createSelectionController ||
      !runtime.createLocaleController
    ) {
      console.error('[finder] Runtime view/selection/locale modules missing.');
      return null;
    }
    return Seedfinder;
  }

  async function start() {
    if (instance) return instance;

    const modules = requireModules();
    if (!modules) return null;

    const { data, state, overlayPrefs } = modules;
    const filtering = modules.core?.filtering || null;

    const dom = runtime.dom.collect();
    const view = runtime.createView({ state, data, dom });
    const selection = runtime.createSelectionController({ state, data, view, filtering });
    const locale = runtime.createLocaleController({ state, data, view });
    const hotkeys = runtime.createHotkeyController ? runtime.createHotkeyController({ dom }) : null;
    const events = runtime.createEventController
      ? runtime.createEventController({ dom, selection, view })
      : null;

    view.setOptionHandlers({
      onSlotClick: slotId => selection.onSlotClick(slotId),
      getSlotOptions: (slotId, excludeCurrent) => selection.getSlotOptions(slotId, excludeCurrent),
      onSelectMap: type => selection.selectMap(type),
    });

    runtime.viewInstance = view;
    runtime.selectionInstance = selection;
    modules.ui = view;
    modules.options = selection;
    modules.locale = locale;
    if (hotkeys) modules.hotkeys = hotkeys;

    await ensureSeedfinderI18N(localStorage.getItem('locale'));

    let payload;
    try {
      payload = await data.loadAll();
    } catch (error) {
      console.error('[finder] Failed to load seed data', error);
      return null;
    }

    state.setSlotCoords(payload.slotCoords);
    state.setSeeds(payload.seeds);
    state.setMapBackgroundByType(payload.mapBackgroundByType);
    state.setMapThumbOrder(payload.mapThumbOrder);
    state.setMapTypeList(payload.mapTypeList);

    view.buildMapButtons(type => selection.selectMap(type));
    view.ensureSlotElements();
    view.showShiftingEarthThumbs();
    view.updateStatus();
    view.updateCandidatesList();
    view.updateSendButtonState();

    if (overlayPrefs?.initOverlayOptions) {
      overlayPrefs.initOverlayOptions();
    }

    events?.bind();
    view.recalcMapLayout();

    if (hotkeys) hotkeys.init();

    await locale.init();
    selection.applySelections();

    instance = {
      teardown() {
        events?.teardown();
        instance = null;
      },
    };

    return instance;
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
  runtime.ensureSeedfinderI18N = ensureSeedfinderI18N;

  ensureStarted();
})();
