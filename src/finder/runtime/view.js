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
      try {
        const { texts } = state.current;
        
        // 基本UI元素
        if (dom.chooseMapText)
          dom.chooseMapText.textContent = texts.ui?.chooseMap || 'Choose Shifting Earth';
        if (dom.statusLabel) dom.statusLabel.textContent = texts.ui?.status || 'Status';
        if (dom.candidatesLabel)
          dom.candidatesLabel.textContent = texts.ui?.candidates || 'Candidates';
        if (dom.resetBtn) dom.resetBtn.textContent = texts.ui?.reset || 'Reset';
        if (dom.sendBtn) dom.sendBtn.textContent = texts.ui?.showOverlay || 'Show Overlay';
        
        // 覆盖层选项相关
        if (dom.overlayOptionsTitle) dom.overlayOptionsTitle.textContent = texts.ui?.overlayOptions || 'Overlay Options';
        if (dom.poiSettingsTitle) dom.poiSettingsTitle.textContent = texts.ui?.poiSettings || 'POI Settings';
        if (dom.overlaySettingsTitle) dom.overlaySettingsTitle.textContent = texts.ui?.overlaySettings || 'Overlay Settings';
        if (dom.hotkeyMenuBtn) dom.hotkeyMenuBtn.textContent = texts.ui?.hotkeySettings || 'Hotkey Settings';
        
        // 显示选项标签
        if (dom.labelShowCamps) dom.labelShowCamps.textContent = texts.ui?.showCamps || 'Show Camps';
        if (dom.labelShowCaravans) dom.labelShowCaravans.textContent = texts.ui?.showCaravans || 'Show Caravans';
        if (dom.labelShowCastle) dom.labelShowCastle.textContent = texts.ui?.showCastleBosses || 'Show Castle Bosses';
        if (dom.labelShowChurches) dom.labelShowChurches.textContent = texts.ui?.showChurches || 'Show Churches';
        if (dom.labelShowEvergaol) dom.labelShowEvergaol.textContent = texts.ui?.showEvergaols || 'Show Evergaols';
        if (dom.labelShowEvent) dom.labelShowEvent.textContent = texts.ui?.showEvents || 'Show Events';
        if (dom.labelShowFieldBoss) dom.labelShowFieldBoss.textContent = texts.ui?.showFieldBosses || 'Show Field Bosses';
        if (dom.labelShowForts) dom.labelShowForts.textContent = texts.ui?.showForts || 'Show Forts';
        if (dom.labelShowGreatChurches) dom.labelShowGreatChurches.textContent = texts.ui?.showGreatChurches || 'Show Great Churches';
        if (dom.labelShowNight) dom.labelShowNight.textContent = texts.ui?.showNightBosses || 'Show Night Bosses';
        if (dom.labelShowRuins) dom.labelShowRuins.textContent = texts.ui?.showRuins || 'Show Ruins';
        if (dom.labelShowSorcererRise) dom.labelShowSorcererRise.textContent = texts.ui?.showSorcererRises || 'Show Sorcerer Rises';
        if (dom.labelShowTownships) dom.labelShowTownships.textContent = texts.ui?.showTownships || 'Show Townships';
        
        // 覆盖层设置标签
        if (dom.labelFontSize) dom.labelFontSize.textContent = (texts.ui?.fontSize || 'Font Size') + ':';
        if (dom.labelOffsetX) dom.labelOffsetX.textContent = (texts.ui?.offsetX || 'Offset X') + ':';
        if (dom.labelOffsetY) dom.labelOffsetY.textContent = (texts.ui?.offsetY || 'Offset Y') + ':';
        if (dom.labelScale) dom.labelScale.textContent = (texts.ui?.scale || 'Scale') + ':';
        if (dom.languageLabel) dom.languageLabel.textContent = texts.ui?.language || 'Language';
        
        // 提示和建议
        if (dom.adviceTooltipIcon) dom.adviceTooltipIcon.setAttribute('title', texts.ui?.seedfinderAdvice || 'Seedfinder Advice');
        if (dom.seedfinderTipsTitle) dom.seedfinderTipsTitle.textContent = texts.ui?.seedfinderTips || 'Seedfinder Tips';
        if (dom.tip1) dom.tip1.innerHTML = texts.ui?.tip1 || 'For fastest pruning, start by placing <b>Spawn</b>, <b>Churches</b>, <b>Sorcerer\'s Rise</b>, and <b>Township</b> icons.';
        if (dom.tip2) dom.tip2.innerHTML = texts.ui?.tip2 || 'For some seeds you <b>Spawn</b> at a <b>Church</b> in these cases please use the combined <b>Church Spawn</b> icon shown below';
        if (dom.tip3) dom.tip3.innerHTML = texts.ui?.tip3 || 'Supplement with other icons like Great Church, Camps, Ruins, and Forts if need be.';
        if (dom.tip4) dom.tip4.innerHTML = texts.ui?.tip4 || 'Hover over icons below for details, and use the overlay options to customize your view.';
        if (dom.tip5) dom.tip5.innerHTML = texts.ui?.tip5 || 'Reset if you make a mistake or want to try a new seed.';
        if (dom.recommendedIconsTitle) dom.recommendedIconsTitle.textContent = texts.ui?.recommendedIcons || 'Recommended Icons to Place First:';
        if (dom.supplementalIconsTitle) dom.supplementalIconsTitle.textContent = texts.ui?.supplementalIcons || 'Supplemental Icons:';
        
        // 快捷键模态框
        if (dom.hotkeyModalTitle) dom.hotkeyModalTitle.textContent = texts.ui?.hotkeyModalTitle || 'Hotkey Settings';
        if (dom.hotkeyModalSubtitle) dom.hotkeyModalSubtitle.textContent = texts.ui?.hotkeyModalSubtitle || 'Customize shortcuts for quick access everywhere.';
        const closeBtn = document.getElementById('hotkey-modal-close');
        if (closeBtn) closeBtn.setAttribute('aria-label', texts.ui?.closeHotkeySettings || 'Close hotkey settings');
        if (dom.resetAllToDefaultText) dom.resetAllToDefaultText.textContent = texts.ui?.resetAllToDefault || 'Reset All to Default';
        if (dom.closeText) dom.closeText.textContent = texts.ui?.close || 'Close';
        if (dom.saveText) dom.saveText.textContent = texts.ui?.save || 'Save';
      } catch (error) {
        console.error('[finder:view] Error in updateTexts:', error);
      }
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
