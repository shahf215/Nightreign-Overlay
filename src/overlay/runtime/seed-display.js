(() => {
  const runtime = (window.OverlayRuntime = window.OverlayRuntime || {});

  function normalizeLabel(value) {
    if (value === undefined || value === null) return '';
    const trimmed = String(value).trim();
    if (!trimmed) return '';
    if (trimmed.toLowerCase() === 'empty') return '';
    return trimmed;
  }

  function stripPrefixes(value, prefixes, stripTypePrefix) {
    const normalized = normalizeLabel(value);
    if (!normalized) return '';
    if (
      typeof stripTypePrefix !== 'function' ||
      !Array.isArray(prefixes) ||
      prefixes.length === 0
    ) {
      return normalized;
    }
    return stripTypePrefix(normalized, prefixes);
  }

  function buildLabelDescriptors(seedData, helpers = {}) {
    if (!seedData || typeof seedData !== 'object') return [];

    const descriptors = [];
    const { stripTypePrefix } = helpers;
    const o18n = (typeof window !== 'undefined' ? window.OverlayI18N : null) || null;

    const addLabel = (poiId, label, styleKey) => {
      const normalized = normalizeLabel(label);
      if (!poiId || !normalized) return;
      descriptors.push({ poiId, text: normalized, styleKey });
    };

    const derivePoiLabels = (entriesOrOne, styleKey, getText) => {
      const entries = Array.isArray(entriesOrOne)
        ? entriesOrOne
        : entriesOrOne
          ? [entriesOrOne]
          : [];
      if (entries.length === 0) return;
      for (const entry of entries) {
        if (!entry || !entry.poi_id) continue;
        const text = typeof getText === 'function' ? getText(entry) : entry?.value || entry?.boss;
        addLabel(entry.poi_id, text, styleKey);
      }
    };

    const night1Boss = normalizeLabel(seedData.night1?.boss);
    if (seedData.night1?.poi_id && night1Boss) {
      const bossName =
        o18n && typeof o18n.bossLabel === 'function'
          ? o18n.bossLabel('night', night1Boss)
          : night1Boss;
      const nightOne =
        o18n && typeof o18n.tUILabel === 'function'
          ? o18n.tUILabel('night1', 'Night 1')
          : 'Night 1';
      addLabel(seedData.night1.poi_id, `${nightOne}: ${bossName}`, 'night');
    }

    const night2Boss = normalizeLabel(seedData.night2?.boss);
    if (seedData.night2?.poi_id && night2Boss) {
      const bossName =
        o18n && typeof o18n.bossLabel === 'function'
          ? o18n.bossLabel('night', night2Boss)
          : night2Boss;
      const nightTwo =
        o18n && typeof o18n.tUILabel === 'function'
          ? o18n.tUILabel('night2', 'Night 2')
          : 'Night 2';
      addLabel(seedData.night2.poi_id, `${nightTwo}: ${bossName}`, 'night');
    }

    derivePoiLabels(seedData.evergaols, 'evergaol', entry => {
      const raw = normalizeLabel(entry?.boss);
      if (!raw) return '';
      return o18n && typeof o18n.bossLabel === 'function' ? o18n.bossLabel('evergaol', raw) : raw;
    });
    derivePoiLabels(seedData.field_bosses, 'field-boss', entry => {
      const raw = normalizeLabel(entry?.boss);
      if (!raw) return '';
      return o18n && typeof o18n.bossLabel === 'function' ? o18n.bossLabel('field', raw) : raw;
    });

    const extraBoss = normalizeLabel(seedData.extra_night_boss);
    derivePoiLabels(seedData.special_events, 'event', event => {
      const baseRaw = normalizeLabel(event?.event);
      if (!baseRaw && !extraBoss) return '';
      const baseLabel = baseRaw
        ? o18n && typeof o18n.eventLabel === 'function'
          ? o18n.eventLabel(baseRaw)
          : baseRaw
        : '';
      if (extraBoss) {
        const extraLabel =
          o18n && typeof o18n.bossLabel === 'function'
            ? o18n.bossLabel('night', extraBoss)
            : extraBoss;
        return baseLabel ? `${baseLabel} - ${extraLabel}` : extraLabel;
      }
      return baseLabel;
    });

    derivePoiLabels(seedData.castle, 'castle-boss', entry => {
      const raw = normalizeLabel(entry?.boss);
      if (!raw) return '';
      return o18n && typeof o18n.bossLabel === 'function' ? o18n.bossLabel('castle', raw) : raw;
    });

    const afterDash = s => {
      if (typeof s !== 'string') return s;

      const sepRegex = /\s[-–—:]\s/;
      const match = s.match(sepRegex);
      if (!match) return s;
      const cutIndex = s.indexOf(match[0]) + match[0].length;
      return s.slice(cutIndex);
    };

    derivePoiLabels(seedData.sorcerers_rises, 'sorcerer-rise', rise => {
      const raw = normalizeLabel(rise?.value);
      if (!raw) return '';
      const label = o18n && typeof o18n.poiLabel === 'function' ? o18n.poiLabel(raw) : raw;

      return afterDash(label);
    });

    const strip = (value, prefixes) => stripPrefixes(value, prefixes, stripTypePrefix);
    const translatePoiLabel = (value, prefixes = []) => {
      const norm = normalizeLabel(value);
      if (!norm) return '';
      const translated =
        o18n && typeof o18n.poiLabel === 'function' ? o18n.poiLabel(norm) : strip(norm, prefixes);
      return afterDash(translated);
    };

    derivePoiLabels(seedData.ruins, 'ruins', ruin =>
      translatePoiLabel(ruin?.value, ['Ruins', 'Ruin'])
    );
    derivePoiLabels(seedData.forts, 'fort', fort =>
      translatePoiLabel(fort?.value, ['Fort', 'Forts'])
    );
    derivePoiLabels(seedData.camps, 'camp', camp =>
      translatePoiLabel(camp?.value, ['Camp', 'Camps'])
    );
    derivePoiLabels(seedData.caravans, 'caravan', caravan =>
      translatePoiLabel(caravan?.value, ['Small Camp', 'SmallCamp', 'Caravans', 'Caravan'])
    );

    derivePoiLabels(seedData.churches, 'church', () => {
      const word =
        o18n && typeof o18n.tUILabel === 'function' ? o18n.tUILabel('church', 'Church') : 'Church';
      return word;
    });

    derivePoiLabels(seedData.great_churches, 'great-church', church =>
      translatePoiLabel(church?.value || church?.boss, [
        'Great Church',
        'Greatchurch',
        'Great_Church',
        'GreatChurch',
      ])
    );

    derivePoiLabels(seedData.townships, 'township', township =>
      translatePoiLabel(township?.value || 'Township', ['Township'])
    );

    return descriptors;
  }

  runtime.seedDisplay = {
    buildLabelDescriptors,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runtime.seedDisplay;
  }
})();
