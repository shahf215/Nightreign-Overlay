(() => {
  const runtime = (window.SeedfinderRuntime = window.SeedfinderRuntime || {});

  function createView({ state, data, dom }) {
    if (!state || !data || !dom) {
      throw new Error('[finder:view] Missing dependencies');
    }

    const mapView = runtime.createMapView({ state, data, dom });

    function setOptionHandlers(handlers) {
      mapView.setHandlers(handlers);
    }

    function updateTexts() {
      const { texts } = state.current;
      if (dom.chooseMapText)
        dom.chooseMapText.textContent = texts.ui?.chooseMap || 'Choose Shifting Earth';
      if (dom.statusLabel) dom.statusLabel.textContent = texts.ui?.status || 'Status';
      if (dom.candidatesLabel)
        dom.candidatesLabel.textContent = texts.ui?.candidates || 'Candidates';
      if (dom.resetBtn) dom.resetBtn.textContent = texts.ui?.reset || 'Reset';
      if (dom.sendBtn) dom.sendBtn.textContent = texts.ui?.showOverlay || 'Show Overlay';
    }

    function buildLocalePicker(onChange) {
      const locales = data.supportedLocales || {};
      if (!dom.localeSelect) return;
      dom.localeSelect.innerHTML = '';
      Object.keys(locales).forEach(code => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = locales[code];
        dom.localeSelect.appendChild(option);
      });
      dom.localeSelect.addEventListener('change', () => onChange(dom.localeSelect.value));
    }

    function setLocaleSelectValue(localeCode) {
      if (dom.localeSelect) {
        dom.localeSelect.value = localeCode;
      }
    }

    function buildMapButtons(onSelect) {
      if (!dom.mapBtns) return;
      const { mapTypeList } = state.current;
      dom.mapBtns.innerHTML = '';
      const fragment = document.createDocumentFragment();
      mapTypeList.forEach(type => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = window.SeedfinderI18N?.shiftingEarthLabel?.(type) || type;
        btn.dataset.mapType = type;
        btn.addEventListener('click', () => onSelect(type));
        fragment.appendChild(btn);
      });
      dom.mapBtns.appendChild(fragment);
      highlightMapButton(state.current.activeMapType || null);
    }

    function highlightMapButton(mapType) {
      mapView.highlightMapButton(mapType);
    }

    function ensureSlotElements() {
      mapView.ensureSlotElements();
    }

    function showShiftingEarthThumbs() {
      mapView.showShiftingEarthThumbs();
    }

    function hideShiftingEarthThumbs() {
      mapView.hideShiftingEarthThumbs();
    }

    function renderSlotIcons() {
      mapView.renderSlotIcons();
    }

    function updateStatus() {
      const { selectionBySlot, activeMapType, candidateSeeds, texts } = state.current;
      if (!dom.statusEl) return;
      if (!activeMapType) {
        dom.statusEl.textContent = texts.ui?.pickMap || 'Pick a map.';
        return;
      }
      const parts = [];
      if (selectionBySlot.nightlord) {
        const nlKey = selectionBySlot.nightlord;
        const tNl = window.SeedfinderI18N?.nightlordLabel?.(nlKey) || nlKey.replace(/^[0-9]+_/, '');
        parts.push(tNl);
      }
      parts.push(window.SeedfinderI18N?.shiftingEarthLabel?.(activeMapType) || activeMapType);
      const candLabel = texts.ui?.candidatesCountLabel || 'candidates';
      parts.push(`${candidateSeeds.length} ${candLabel}`);
      dom.statusEl.textContent = parts.join(' | ');
    }

    function updateCandidatesList() {
      if (!dom.candidatesList || !dom.countEl) return;
      const { candidateSeeds } = state.current;

      dom.countEl.setAttribute('dir', 'ltr');
      dom.countEl.textContent = `(${candidateSeeds.length})`;
      dom.candidatesList.innerHTML = '';
      const maxDisplay = 100;
      candidateSeeds.slice(0, maxDisplay).forEach(seed => {
        const li = document.createElement('li');
        li.textContent = `Seed ${seed.seed_id}`;
        dom.candidatesList.appendChild(li);
      });
    }

    function updateSendButtonState() {
      if (!dom.sendBtn) return;
      dom.sendBtn.disabled = state.current.candidateSeeds.length !== 1;
    }

    function resetActiveMap() {
      state.setActiveMapType(null);
      state.clearSelections();
      highlightMapButton(null);
      renderSlotIcons();
      updateStatus();
      updateCandidatesList();
      updateSendButtonState();
    }

    function recalcMapLayout() {
      mapView.recalcMapLayout();
    }

    function showSingleSeedOverlay() {
      if (state.current.candidateSeeds.length !== 1) return;
      const seed = state.current.candidateSeeds[0];
      const payload = {
        nightlord: state.current.selectionBySlot.nightlord || '',
        seed_id: seed.seed_id,
        seed,
      };
      try {
        window.app?.seed?.sendSelected?.(payload);
      } catch (error) {
        console.error('Failed to send result to overlay', error);
      }
    }

    function clearOverlayIfNeeded(previousSeed) {
      if (previousSeed && state.current.candidateSeeds.length !== 1) {
        try {
          window.app?.overlay?.reset?.();
        } catch (error) {
          console.warn('Failed to reset overlay', error);
        }
      }
    }

    function closeSlotPicker() {
      mapView.closeSlotPicker();
    }

    function openSlotPicker(slotId, options, onSelect) {
      mapView.openSlotPicker(slotId, options, onSelect);
    }

    return {
      dom,
      setOptionHandlers,
      updateTexts,
      buildLocalePicker,
      setLocaleSelectValue,
      buildMapButtons,
      highlightMapButton,
      ensureSlotElements,
      renderSlotIcons,
      updateStatus,
      updateCandidatesList,
      updateSendButtonState,
      resetActiveMap,
      recalcMapLayout,
      showShiftingEarthThumbs,
      hideShiftingEarthThumbs,
      showSingleSeedOverlay,
      clearOverlayIfNeeded,
      openSlotPicker,
      closeSlotPicker,
    };
  }

  runtime.createView = createView;
})();
