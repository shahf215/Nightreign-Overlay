(function () {
  const Seedfinder = (window.Seedfinder = window.Seedfinder || {});
  const { config } = Seedfinder.data;

  const state = {
    locale: 'en',
    texts: {},
    slotCoords: [],
    seeds: [],
    mapBackgroundByType: {},
    mapThumbOrder: [],
    mapTypeList: [],
    activeMapType: null,
    selectionBySlot: {},
    candidateSeeds: [],
    resolvedSeed: null,
    mapPixelSize: config.MAP_ORIGINAL_SIZE,
    slotIconSize: config.MAP_ORIGINAL_SIZE * config.ICON_SCALE_RATIO,
    slotElementById: new Map(),
  };

  function coerceArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function coerceObject(value) {
    return value && typeof value === 'object' ? value : {};
  }

  Seedfinder.state = {
    current: state,
    setLocale(value) {
      state.locale = value || 'en';
    },
    setTexts(value) {
      state.texts = coerceObject(value);
    },
    setSlotCoords(value) {
      state.slotCoords = coerceArray(value);
    },
    setSeeds(value) {
      state.seeds = coerceArray(value);
    },
    setMapBackgroundByType(value) {
      state.mapBackgroundByType = coerceObject(value);
    },
    setMapThumbOrder(value) {
      state.mapThumbOrder = coerceArray(value);
    },
    setMapTypeList(value) {
      state.mapTypeList = coerceArray(value);
    },
    setActiveMapType(value) {
      state.activeMapType = value || null;
    },
    setSelectionBySlot(value) {
      state.selectionBySlot = coerceObject(value);
    },
    updateSelection(slotId, value) {
      if (!slotId) return;
      if (!value || value === 'empty') {
        delete state.selectionBySlot[slotId];
      } else {
        state.selectionBySlot[slotId] = value;
      }
    },
    clearSelections() {
      state.selectionBySlot = {};
      state.candidateSeeds = [];
      state.resolvedSeed = null;
    },
    setCandidateSeeds(value) {
      state.candidateSeeds = coerceArray(value);
    },
    setResolvedSeed(value) {
      state.resolvedSeed = value || null;
    },
    setSizes(mapPixelSize, slotIconSize) {
      state.mapPixelSize = mapPixelSize;
      state.slotIconSize = slotIconSize;
    },
    setSlotElements(map) {
      state.slotElementById = map instanceof Map ? map : new Map();
    },
  };
})();
