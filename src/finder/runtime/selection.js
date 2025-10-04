(() => {
  const runtime = (window.SeedfinderRuntime = window.SeedfinderRuntime || {});

  function createSelectionController({ state, data, view, filtering }) {
    if (!state || !data || !view) {
      throw new Error('[finder:selection] Missing dependencies');
    }

    const { buildingIcons, nightlordIcons, buildingIconIds } = data;

    const resolveSeedMapType = seed => {
      if (filtering?.resolveSeedMapType) {
        return filtering.resolveSeedMapType(seed);
      }
      return seed?.shiftingEarth || 'Default';
    };

    function getBaseSeedsForActiveMap() {
      const { seeds, activeMapType } = state.current;
      if (filtering?.filterByMap) {
        return filtering.filterByMap(seeds, activeMapType);
      }
      if (!activeMapType) return [];
      return (Array.isArray(seeds) ? seeds : []).filter(
        seed => resolveSeedMapType(seed) === activeMapType
      );
    }

    const NIGHTLORD_ORDER = [
      'empty',
      'Gladius',
      'Adel',
      'Gnoster',
      'Maris',
      'Libra',
      'Fulghor',
      'Caligo',
      'Heolstor',
    ];

    function getSlotOptions(slotId, excludeCurrent) {
      if (filtering?.buildSlotOptions) {
        const opts = filtering.buildSlotOptions({
          seeds: state.current.seeds,
          selection: state.current.selectionBySlot,
          slotId,
          mapType: state.current.activeMapType,
          buildingIconIds,
          buildingIcons,
          nightlordIcons,
          excludeCurrent,
        });
        if (slotId !== 'nightlord') return opts;
        const currentVal = (state.current.selectionBySlot || {})[slotId] || 'empty';
        const includeEmpty = !(excludeCurrent && currentVal === 'empty');
        if (includeEmpty && !opts.some(o => o.id === 'empty')) {
          opts.push({ id: 'empty', src: nightlordIcons?.empty || buildingIcons.empty });
        }
        const pos = new Map(NIGHTLORD_ORDER.map((id, i) => [id, i]));
        return opts.slice().sort((a, b) => {
          const ai = pos.has(a.id)
            ? pos.get(a.id)
            : NIGHTLORD_ORDER.length + (a.id || '').localeCompare(b.id || '');
          const bi = pos.has(b.id)
            ? pos.get(b.id)
            : NIGHTLORD_ORDER.length + (b.id || '').localeCompare(a.id || '');
          if (ai === bi) return (a.id || '').localeCompare(b.id || '');
          return ai - bi;
        });
      }

      const { activeMapType, selectionBySlot } = state.current;
      const validIds = new Set();
      const seeds = Array.isArray(state.current.seeds) ? state.current.seeds : [];
      for (const seed of seeds) {
        const seedMapType = resolveSeedMapType(seed);
        if (activeMapType && seedMapType !== activeMapType) continue;
        let matches = true;
        for (const [selectedId, value] of Object.entries(selectionBySlot || {})) {
          if (selectedId === slotId) continue;
          if (!value || value === 'empty') continue;
          if (selectedId === 'nightlord') {
            if ((seed?.nightlord || '') !== value) {
              matches = false;
              break;
            }
          } else {
            const seedValue = seed?.slots?.[selectedId] || '';
            if (seedValue !== value) {
              matches = false;
              break;
            }
          }
        }
        if (!matches) continue;
        if (slotId === 'nightlord') {
          validIds.add(seed?.nightlord || 'empty');
        } else {
          const val = seed?.slots?.[slotId] || '';
          validIds.add(val || 'empty');
        }
      }
      validIds.add('empty');
      if (excludeCurrent) {
        const currentVal = (state.current.selectionBySlot || {})[slotId] || 'empty';
        validIds.delete(currentVal);
      }
      const iconsPool = slotId === 'nightlord' ? nightlordIcons : buildingIcons;
      let order;
      if (slotId === 'nightlord') {
        const existing = new Set(Object.keys(nightlordIcons));
        order = NIGHTLORD_ORDER.filter(id => existing.has(id)).concat(
          Array.from(existing)
            .filter(id => !NIGHTLORD_ORDER.includes(id))
            .sort()
        );
      } else {
        order = buildingIconIds;
      }
      return order
        .filter(id => validIds.has(id))
        .map(id => ({ id, src: iconsPool[id] || buildingIcons.empty }));
    }

    function applySelections() {
      const { selectionBySlot, activeMapType } = state.current;
      let filtered = [];
      let resolved = null;

      if (filtering?.deriveCandidateState) {
        const result = filtering.deriveCandidateState({
          seeds: state.current.seeds,
          selection: selectionBySlot,
          mapType: activeMapType,
        });
        filtered = result.filtered;
        resolved = result.resolvedSeed;
      } else {
        let seeds = getBaseSeedsForActiveMap();
        filtered = seeds;
        for (const [slotId, value] of Object.entries(selectionBySlot || {})) {
          if (!value || value === 'empty') continue;
          filtered = filtered.filter(seed => {
            if (!seed) return false;
            if (slotId === 'nightlord') {
              return (seed.nightlord || '') === value;
            }
            return (seed.slots?.[slotId] || '') === value;
          });
        }
        resolved = filtered.length === 1 ? filtered[0] : null;
      }

      const previousResolved = state.current.resolvedSeed;
      state.setCandidateSeeds(filtered);
      state.setResolvedSeed(resolved);
      view.updateStatus();
      view.updateCandidatesList();
      view.updateSendButtonState();
      view.renderSlotIcons();

      if (resolved && (!previousResolved || resolved.seed_id !== previousResolved.seed_id)) {
        try {
          view.showSingleSeedOverlay();
        } catch (error) {
          console.warn('[finder:selection] Failed to show overlay for single seed', error);
        }
      }
      view.clearOverlayIfNeeded(previousResolved);
    }

    function selectMap(mapType) {
      if (state.current.activeMapType === mapType) return;
      state.setActiveMapType(mapType);
      state.setSelectionBySlot({});
      view.highlightMapButton(mapType);
      applySelections();
    }

    function resetFinderState() {
      state.setSelectionBySlot({});
      state.setActiveMapType(null);
      state.setCandidateSeeds([]);
      state.setResolvedSeed(null);
      view.resetActiveMap();
      try {
        window.app?.overlay?.reset?.();
      } catch (error) {
        console.warn('Failed to reset overlay', error);
      }
    }

    function onSlotClick(slotId) {
      if (!state.current.activeMapType) return;
      const currentVal = state.current.selectionBySlot[slotId] || 'empty';
      const options = getSlotOptions(slotId, false);
      if (
        currentVal === 'empty' &&
        options.length === 2 &&
        options.some(opt => opt.id !== 'empty')
      ) {
        const nonEmpty = options.find(opt => opt.id !== 'empty');
        if (nonEmpty) {
          state.updateSelection(slotId, nonEmpty.id);
          applySelections();
          return;
        }
      }

      const modalOptions = getSlotOptions(slotId, true);
      if (modalOptions.length === 0) {
        delete state.current.selectionBySlot[slotId];
        applySelections();
        return;
      }
      if (modalOptions.length === 1) {
        const [opt] = modalOptions;
        if (opt.id === 'empty') {
          delete state.current.selectionBySlot[slotId];
        } else {
          state.updateSelection(slotId, opt.id);
        }
        applySelections();
        return;
      }

      view.openSlotPicker(slotId, modalOptions, opt => {
        if (opt.id === 'empty') {
          delete state.current.selectionBySlot[slotId];
        } else {
          state.updateSelection(slotId, opt.id);
        }
        applySelections();
      });
    }

    function dispatchSeedToOverlay() {
      view.showSingleSeedOverlay();
    }

    return {
      getSlotOptions,
      applySelections,
      selectMap,
      onSlotClick,
      resetFinderState,
      dispatchSeedToOverlay,
    };
  }

  runtime.createSelectionController = createSelectionController;
})();
