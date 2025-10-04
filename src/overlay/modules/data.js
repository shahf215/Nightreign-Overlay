(function initializeOverlayDataModule(root) {
  const namespace = (root.OverlayModules = root.OverlayModules || {});

  const SORCERERS_RISE_PREFIX = "Sorcerer's Rise - ";
  const NIGHTLORD_GROUPS = [
    'Gladius',
    'Adel',
    'Gnoster',
    'Maris',
    'Libra',
    'Fulghor',
    'Caligo',
    'Heolstor',
  ];

  let poiList = [];
  let poiById = new Map();
  let activeSeed = null;

  function shouldLogDev() {
    if (typeof localStorage === 'undefined') return false;
    try {
      return Boolean(localStorage.getItem('dev'));
    } catch {
      return false;
    }
  }

  async function loadPoiData() {
    try {
      const res = await fetch('../assets/data/poi_uv_with_ids.json');
      if (!res || !res.ok) {
        throw new Error(`HTTP ${res ? res.status : 'ERR'}`);
      }
      const uv = await res.json();
      poiList = Array.isArray(uv) ? uv : [];
    } catch (error) {
      poiList = [];
      if (shouldLogDev()) {
        console.warn('[overlay:data] Failed to load POI data', error);
      }
    }
    poiById = new Map(poiList.map(item => [item.id, item]));
  }

  function normalizePatternSeed(entry, fallbackNightlord) {
    if (!entry || typeof entry !== 'object') return null;

    const seedIdValue = entry.layout_number ?? entry.layoutNumber ?? entry.seed_id ?? entry.seedId;
    const seedId = seedIdValue !== undefined && seedIdValue !== null ? String(seedIdValue) : '';
    const nightlord = entry.nightlord || fallbackNightlord || null;
    const shiftingEarth = entry.shiftingEarth || entry.shifting_earth || null;

    return {
      ...entry,
      seedId,
      nightlord,
      shiftingEarth,
      mapType: shiftingEarth,
    };
  }

  async function loadSeedsForNightlord(nightlordName) {
    if (!nightlordName) return null;
    const parts = String(nightlordName).split('_');
    const base = parts.length > 1 ? parts.slice(1).join('_') : parts[0];
    try {
      const res = await fetch(`../assets/data/patterns_by_nightlord/${base}.json`);
      if (!res || !res.ok) {
        throw new Error(`HTTP ${res ? res.status : 'ERR'}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        return [];
      }
      return data.map(entry => normalizePatternSeed(entry, base)).filter(Boolean);
    } catch (error) {
      if (shouldLogDev()) {
        console.warn(`[overlay] Failed to load seeds for ${nightlordName}:`, error);
      }
      return [];
    }
  }

  function resolveNightlordForSeedId(seedId) {
    const idNum = Number(String(seedId).replace(/^0+/, '')) || 1;
    const perNightlord = 40;
    const groupIndex = Math.floor((idNum - 1) / perNightlord);
    return NIGHTLORD_GROUPS[groupIndex] || null;
  }

  function findSeed(list, seedId) {
    if (!list || seedId === undefined || seedId === null) return null;
    const idNum = Number(String(seedId).replace(/^0+/, '')) || 1;
    const perNightlord = 40;
    const idx = ((idNum - 1) % perNightlord) + 1;

    for (const entry of list) {
      const candidateId = entry?.seedId ?? entry?.layout_number;
      const pNum = Number(String(candidateId).replace(/^0+/, '')) || 1;
      const pIdx = ((Math.max(1, pNum) - 1) % perNightlord) + 1;
      if (pIdx === idx) {
        return entry;
      }
    }
    return null;
  }

  namespace.data = {
    SORCERERS_RISE_PREFIX,
    NIGHTLORD_GROUPS,
    loadPoiData,
    getPoiList: () => poiList,
    getPoiRecord: id => poiById.get(id),
    loadSeedsForNightlord,
    resolveNightlordForSeedId,
    findSeed,
    getActiveSeed: () => activeSeed,
    setActiveSeed(value) {
      activeSeed = value;
    },
    resetActiveSeed() {
      activeSeed = null;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
