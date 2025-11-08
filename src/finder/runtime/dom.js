(() => {
  const runtime = (window.SeedfinderRuntime = window.SeedfinderRuntime || {});

  function query(id) {
    return document.getElementById(id);
  }

  function collect() {
    return {
      localeSelect: query('localeSelect'),
      chooseMapText: query('chooseMapText'),
      statusLabel: query('statusLabel'),
      candidatesLabel: query('candidatesLabel'),
      statusEl: query('status'),
      countEl: query('count'),
      candidatesList: query('cand'),
      mapBtns: query('mapBtns'),
      resetBtn: query('resetButton'),
      sendBtn: query('sendButton'),
      mapImage: query('mapImage'),
      iconLayer: query('iconLayer'),
      modal: query('modal'),
      modalContent: query('modalContent'),
      mapWrapper: query('mapWrapper'),
      thumbs: query('thumbs'),
      seedfinderContainer: query('seedfinder-container'),
      overlayModal: query('modal'),
      hotkeyMenuBtn: query('hotkey-menu-btn'),
      hotkeyModal: query('hotkey-modal'),
      closeHotkeyModal: query('close-hotkey-modal'),
      hotkeyCloseIcon: query('hotkey-modal-close'),
      hotkeyList: query('hotkey-list'),
      hotkeyFooter: query('hotkey-footer'),
      hotkeySaveBtn: query('hotkey-save-btn'),
      resetHotkeysBtn: query('reset-hotkeys-btn'),
      overlayOptionsTitle: query('overlayOptionsTitle'),
      poiSettingsTitle: query('poiSettingsTitle'),
      overlaySettingsTitle: query('overlaySettingsTitle'),
      labelShowCamps: query('labelShowCamps'),
      labelShowCaravans: query('labelShowCaravans'),
      labelShowCastle: query('labelShowCastle'),
      labelShowChurches: query('labelShowChurches'),
      labelShowEvergaol: query('labelShowEvergaol'),
      labelShowEvent: query('labelShowEvent'),
      labelShowFieldBoss: query('labelShowFieldBoss'),
      labelShowForts: query('labelShowForts'),
      labelShowGreatChurches: query('labelShowGreatChurches'),
      labelShowNight: query('labelShowNight'),
      labelShowRuins: query('labelShowRuins'),
      labelShowSorcererRise: query('labelShowSorcererRise'),
      labelShowTownships: query('labelShowTownships'),
      labelFontSize: query('labelFontSize'),
      labelOffsetX: query('labelOffsetX'),
      labelOffsetY: query('labelOffsetY'),
      labelScale: query('labelScale'),
      languageLabel: query('languageLabel'),
      adviceTooltipIcon: query('adviceTooltipIcon'),
      seedfinderTipsTitle: query('seedfinderTipsTitle'),
      tip1: query('tip1'),
      tip2: query('tip2'),
      tip3: query('tip3'),
      tip4: query('tip4'),
      tip5: query('tip5'),
      recommendedIconsTitle: query('recommendedIconsTitle'),
      supplementalIconsTitle: query('supplementalIconsTitle'),
      hotkeyModalTitle: query('hotkey-modal-title'),
      hotkeyModalSubtitle: query('hotkey-modal-subtitle'),
      resetAllToDefaultText: query('reset-all-to-default-text'),
      closeText: query('close-text'),
      saveText: query('save-text'),
    };
  }

  runtime.dom = {
    collect,
  };
})();
