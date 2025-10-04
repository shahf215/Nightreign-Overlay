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
    };
  }

  runtime.dom = {
    collect,
  };
})();
