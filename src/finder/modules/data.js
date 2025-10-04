(function () {
  const Seedfinder = (window.Seedfinder = window.Seedfinder || {});

  const MAP_ORIGINAL_SIZE = 1000;
  const MAP_MIN_SIZE = 400;
  const MAP_MAX_SIZE = 1500;
  const ICON_SCALE_RATIO = 1 / 14;

  const SLOT_ID_RANGE = Array.from({ length: 27 }, (_, index) =>
    String(index + 1).padStart(2, '0')
  );

  const buildingIconIds = [
    'empty',
    'church',
    'spawn',
    'church_spawn',
    'fort',
    'fort_magic',
    'greatchurch',
    'greatchurch_fire',
    'greatchurch_holy',
    'mainencampment',
    'mainencampment_electric',
    'mainencampment_fire',
    'mainencampment_madness',
    'ruins',
    'ruins_bleed',
    'ruins_blight',
    'ruins_electric',
    'ruins_fire',
    'ruins_frostbite',
    'ruins_holy',
    'ruins_magic',
    'ruins_poison',
    'ruins_sleep',
    'sorcerers',
    'township',
  ];

  function buildIconPath(dir, file) {
    return `../assets/${dir}/${file}.webp`;
  }

  const buildingIcons = {};
  for (const id of buildingIconIds) {
    buildingIcons[id] = buildIconPath('buildingIcons', id);
  }

  const nightlordIcons = {
    Gladius: buildIconPath('nightlordIcons', 'Gladius'),
    Adel: buildIconPath('nightlordIcons', 'Adel'),
    Gnoster: buildIconPath('nightlordIcons', 'Gnoster'),
    Maris: buildIconPath('nightlordIcons', 'Maris'),
    Libra: buildIconPath('nightlordIcons', 'Libra'),
    Fulghor: buildIconPath('nightlordIcons', 'Fulghor'),
    Caligo: buildIconPath('nightlordIcons', 'Caligo'),
    Heolstor: buildIconPath('nightlordIcons', 'Heolstor'),
  };

  const DEFAULT_MAP_THUMB_ORDER = [
    'Default',
    'Mountaintop',
    'Crater',
    'Rotted Woods',
    'Noklateo, the Shrouded City',
  ];

  const disabledSlotsByMap = {
    Crater: new Set([1, 3, 5, 6, 10, 11, 14]),
    'Rotted Woods': new Set([17, 18, 19, 20, 22, 25, 27]),
    'Noklateo, the Shrouded City': new Set([15, 16, 21, 23, 24, 26]),
    Mountaintop: new Set([1, 4, 6, 8, 10, 13]),
  };

  async function fetchJson(url, fallback) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data ?? fallback;
    } catch (error) {
      console.error(`[seedfinder] Failed to load ${url}`, error);
      return fallback;
    }
  }

  function resolveMapThumbOrder(mapBackgroundByType) {
    const preferred = DEFAULT_MAP_THUMB_ORDER.filter(type => mapBackgroundByType[type]);
    const fallback = Object.keys(mapBackgroundByType).sort();
    return preferred.length > 0 ? preferred : fallback;
  }

  function resolveMapTypes(seeds, mapBackgroundByType) {
    const seen = new Set();
    const ordered = [];
    for (const seed of seeds) {
      const type = seed?.shiftingEarth || 'Default';
      if (!seen.has(type)) {
        seen.add(type);
        ordered.push(type);
      }
    }
    return ordered.filter(type => mapBackgroundByType[type]);
  }

  function normalizeSlots(slots) {
    const normalized = {};
    const source = slots && typeof slots === 'object' ? slots : {};
    for (const slotId of SLOT_ID_RANGE) {
      const fallbackKey = String(Number(slotId));
      const value = source[slotId] ?? source[fallbackKey] ?? '';
      normalized[slotId] = typeof value === 'string' ? value : String(value || '');
    }
    return normalized;
  }

  function normalizeSeedData(record) {
    if (!record || typeof record !== 'object') {
      return null;
    }

    const shiftingEarth = record.map_type || 'Default';
    const normalized = {
      ...record,
      slots: normalizeSlots(record.slots),
      shiftingEarth,
    };

    normalized.camelCase = {
      seedId: record.seed_id,
      mapType: shiftingEarth,
      event: record.Event,
    };

    return normalized;
  }

  async function loadAll() {
    const slotCoords = (await fetchJson('../assets/data/coordsXY.json', [])) || [];
    const rawSeeds = (await fetchJson('../assets/data/seed_data.json', [])) || [];
    const rawBackgrounds = (await fetchJson('../assets/data/map_backgrounds.json', {})) || {};

    const mapBackgroundByType = {};
    for (const [type, relPath] of Object.entries(rawBackgrounds)) {
      if (typeof relPath === 'string' && relPath.trim().length > 0) {
        mapBackgroundByType[type] = `../assets/${relPath}`;
      }
    }

    const seeds = rawSeeds.map(normalizeSeedData).filter(Boolean);

    const mapThumbOrder = resolveMapThumbOrder(mapBackgroundByType);
    const mapTypeList = resolveMapTypes(seeds, mapBackgroundByType);

    return {
      slotCoords,
      seeds,
      mapBackgroundByType,
      mapThumbOrder,
      mapTypeList,
    };
  }

  Seedfinder.data = {
    config: {
      MAP_ORIGINAL_SIZE,
      MAP_MIN_SIZE,
      MAP_MAX_SIZE,
      ICON_SCALE_RATIO,
    },
    supportedLocales: {
      ar: 'العربية',
      en: 'English',
      es: 'Español',
      ja: '日本語',
      ko: '한국어',
      pl: 'Polski',
      pt: 'Português',
      ru: 'Русский',
      zh: '中文',
    },
    buildingIconIds,
    buildingIcons,
    nightlordIcons,
    disabledSlotsByMap,
    defaultThumbOrder: DEFAULT_MAP_THUMB_ORDER,
    loadAll,
  };
})();
