(function (rootFactory) {
  const root =
    typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this;
  if (typeof module === 'object' && module.exports) {
    module.exports = rootFactory();
  } else {
    const Seedfinder = (root.Seedfinder = root.Seedfinder || {});
    Seedfinder.core = Seedfinder.core || {};
    Seedfinder.core.filtering = rootFactory();
  }
})(function () {
  function ensureArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function ensureSelection(value) {
    return value && typeof value === 'object' ? value : {};
  }

  function normalizeValue(value) {
    if (!value) return 'empty';
    return value;
  }

  function resolveSeedMapType(seed) {
    if (!seed) return 'Default';
    if (seed.shiftingEarth) return seed.shiftingEarth;
    if (seed.camelCase?.mapType) return seed.camelCase.mapType || 'Default';
    return 'Default';
  }

  function filterByMap(seeds, mapType) {
    const list = ensureArray(seeds);
    if (!mapType) return [];
    const targetType = mapType;
    return list.filter(seed => resolveSeedMapType(seed) === targetType);
  }

  function matchesSelection(seed, selection) {
    if (!seed) return false;
    const slots = seed.slots || {};
    for (const [slotId, value] of Object.entries(selection)) {
      if (!value || value === 'empty') continue;
      if (slotId === 'nightlord') {
        if ((seed.nightlord || '') !== value) {
          return false;
        }
        continue;
      }
      if ((slots[slotId] || '') !== value) {
        return false;
      }
    }
    return true;
  }

  function filterBySelection(seeds, selection) {
    const list = ensureArray(seeds);
    const normalized = ensureSelection(selection);
    if (list.length === 0) return [];
    return list.filter(seed => matchesSelection(seed, normalized));
  }

  function matchesSelectionIgnoringSlot(seed, selection, slotId) {
    if (!seed) return false;
    const slots = seed.slots || {};
    for (const [selectedId, value] of Object.entries(selection)) {
      if (selectedId === slotId) continue;
      if (!value || value === 'empty') continue;
      if (selectedId === 'nightlord') {
        if ((seed.nightlord || '') !== value) {
          return false;
        }
        continue;
      }
      if ((slots[selectedId] || '') !== value) {
        return false;
      }
    }
    return true;
  }

  function resolveSlotValues({ seeds, selection, slotId, includeEmpty = true, excludeValue }) {
    const values = new Set();
    const normalizedSelection = ensureSelection(selection);
    const list = ensureArray(seeds);
    for (const seed of list) {
      if (!matchesSelectionIgnoringSlot(seed, normalizedSelection, slotId)) continue;
      if (slotId === 'nightlord') {
        values.add(normalizeValue(seed?.nightlord));
      } else {
        const slotValue = seed?.slots?.[slotId] || '';
        values.add(normalizeValue(slotValue));
      }
    }
    if (includeEmpty) {
      values.add('empty');
    }
    if (excludeValue) {
      values.delete(excludeValue);
    }
    return values;
  }

  function buildSlotOptions({
    seeds,
    selection,
    slotId,
    mapType,
    buildingIconIds,
    buildingIcons,
    nightlordIcons,
    excludeCurrent,
  }) {
    const baseSeeds = mapType ? filterByMap(seeds, mapType) : [];
    const currentValue = selection?.[slotId] || 'empty';
    const values = resolveSlotValues({
      seeds: baseSeeds,
      selection,
      slotId,
      includeEmpty: true,
      excludeValue: excludeCurrent ? currentValue : undefined,
    });
    const isNightlord = slotId === 'nightlord';
    const iconPool = isNightlord ? nightlordIcons : buildingIcons;
    const emptyFallback = buildingIcons?.empty || '';
    const order = isNightlord
      ? Object.keys(iconPool || {}).sort()
      : Array.isArray(buildingIconIds) && buildingIconIds.length > 0
        ? buildingIconIds
        : Object.keys(iconPool || {}).sort();
    return order
      .filter(id => values.has(id))
      .map(id => ({ id, src: iconPool?.[id] || emptyFallback }));
  }

  function deriveCandidateState({ seeds, selection, mapType }) {
    const baseSeeds = mapType ? filterByMap(seeds, mapType) : [];
    const filtered = filterBySelection(baseSeeds, selection);
    const resolvedSeed = filtered.length === 1 ? filtered[0] : null;
    return {
      baseSeeds,
      filtered,
      resolvedSeed,
    };
  }

  function deriveGhostOption(options) {
    if (!Array.isArray(options) || options.length !== 2) return null;
    const nonEmpty = options.find(option => option.id && option.id !== 'empty');
    return nonEmpty || null;
  }

  return {
    resolveSeedMapType,
    filterByMap,
    filterBySelection,
    resolveSlotValues,
    buildSlotOptions,
    deriveCandidateState,
    deriveGhostOption,
  };
});
