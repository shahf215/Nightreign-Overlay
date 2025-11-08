(() => {
  const runtime = (window.SeedfinderRuntime = window.SeedfinderRuntime || {});

  function shouldLogDev() {
    if (typeof localStorage === 'undefined') return false;
    try {
      return Boolean(localStorage.getItem('dev'));
    } catch {
      return false;
    }
  }

  function devWarn(message, error) {
    if (shouldLogDev()) {
      console.warn(message, error);
    }
  }

  function createHotkeyController({ dom }) {
    if (!dom) throw new Error('[finder:hotkeys] Missing DOM references');

    const ACTION = {
      TOGGLE_FINDER: 'toggleFinder',
      SEND_TO_OVERLAY: 'sendToOverlay',
      TOGGLE_OVERLAY: 'toggleOverlay',
      RESET_OVERLAY: 'resetOverlay',
    };
    const LABEL = {
      [ACTION.TOGGLE_FINDER]: 'Toggle Seed Finder',
      [ACTION.SEND_TO_OVERLAY]: 'Send To Overlay',
      [ACTION.TOGGLE_OVERLAY]: 'Toggle Overlay',
      [ACTION.RESET_OVERLAY]: 'Reset Overlay',
    };

    const ACTION_BY_LABEL = Object.fromEntries(Object.entries(LABEL).map(([a, l]) => [l, a]));

    const HOTKEY_STORAGE_KEY = 'customHotkeys';
    const keymap = runtime.keymap || {};
    const defaultHotkeys = {
      [LABEL[ACTION.TOGGLE_FINDER]]: 'F7',
      [LABEL[ACTION.SEND_TO_OVERLAY]]: 'F8',
      [LABEL[ACTION.TOGGLE_OVERLAY]]: 'F9',
      [LABEL[ACTION.RESET_OVERLAY]]: 'F10',
    };

    const sanitizeAccelerator = keymap.sanitizeAccelerator || ((v, f) => v || f);
    const comboFromEvent = keymap.comboFromEvent || (ev => ev?.key || '');

    let draft = null;
    let activeRecorderCleanup = null;

    const suspendHotkeys = flag => {
      try {
        window.app?.hotkeys?.suspend?.(flag);
      } catch (error) {
        devWarn('[finder:hotkeys] Failed to toggle hotkey suspension', error);
      }
    };

    function getStoredHotkeys() {
      const stored = localStorage.getItem(HOTKEY_STORAGE_KEY);
      if (!stored) return null;
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }

    function buildHotkeyMap(source) {
      const result = { ...defaultHotkeys };
      if (!source) return result;
      Object.keys(result).forEach(label => {
        result[label] = sanitizeAccelerator(source[label], result[label]);
      });
      return result;
    }

    const getActiveHotkeys = () => buildHotkeyMap(getStoredHotkeys());
    const getWorkingHotkeys = () => (draft ? buildHotkeyMap(draft) : getActiveHotkeys());
    const setDraft = map => {
      draft = map ? buildHotkeyMap(map) : null;
    };
    const mapsEqual = (a, b) => {
      const ak = Object.keys(a),
        bk = Object.keys(b);
      if (ak.length !== bk.length) return false;
      for (const k of ak) if (a[k] !== b[k]) return false;
      return true;
    };
    const markDirty = flag => {
      if (dom.hotkeySaveBtn) dom.hotkeySaveBtn.disabled = !flag;
    };

    function setCustomHotkeys(map) {
      const sanitized = buildHotkeyMap(map);
      localStorage.setItem(HOTKEY_STORAGE_KEY, JSON.stringify(sanitized));

      try {
        window.app?.hotkeys?.save?.({
          toggleSeedFinder: sanitized[LABEL[ACTION.TOGGLE_FINDER]],
          sendToOverlay: sanitized[LABEL[ACTION.SEND_TO_OVERLAY]],
          toggleOverlay: sanitized[LABEL[ACTION.TOGGLE_OVERLAY]],
          resetOverlay: sanitized[LABEL[ACTION.RESET_OVERLAY]],
        });
      } catch (error) {
        devWarn('[finder:hotkeys] Failed to persist custom hotkeys', error);
      }
    }

    function actionContext() {
      return { view: window.SeedfinderRuntime?.viewInstance, dom };
    }

    const ACTION_HANDLERS = {
      [ACTION.TOGGLE_FINDER]: () => {
        const { dom: d } = actionContext();
        const container = d.seedfinderContainer;
        if (container) container.style.display = container.style.display === 'none' ? '' : 'none';
      },
      [ACTION.SEND_TO_OVERLAY]: () => {
        const { view } = actionContext();
        try {
          view?.showSingleSeedOverlay?.();
        } catch (error) {
          devWarn('[finder:hotkeys] Failed to trigger overlay send action', error);
        }
      },
      [ACTION.TOGGLE_OVERLAY]: () => {
        const { dom: d } = actionContext();
        const overlayModal = d.overlayModal;
        if (overlayModal)
          overlayModal.style.display = overlayModal.style.display === 'none' ? '' : 'none';
      },
      [ACTION.RESET_OVERLAY]: () => {
        const { dom: d } = actionContext();
        const overlayModal = d.overlayModal;
        if (overlayModal) overlayModal.style.display = '';
      },
    };

    function performActionId(actionId) {
      const fn = ACTION_HANDLERS[actionId];
      if (fn) fn();
    }
    function performActionLabel(label) {
      performActionId(ACTION_BY_LABEL[label]);
    }

    function renderHotkeyList({ focusFirst = false } = {}) {
      if (!dom.hotkeyList) return;
      const working = getWorkingHotkeys();
      dom.hotkeyList.innerHTML = '';
      dom.hotkeyList.scrollTop = 0;
      Object.entries(working).forEach(([label, key]) => {
        const row = document.createElement('div');
        row.className = 'hotkey-row';
        const actionEl = document.createElement('span');
        actionEl.className = 'hotkey-row__action';
        actionEl.textContent = label;
        const keyBtn = document.createElement('button');
        keyBtn.type = 'button';
        keyBtn.dataset.action = label;
        keyBtn.className = 'btn btn--ghost hotkey-key-btn';
        keyBtn.textContent = key;
        row.append(actionEl, keyBtn);
        dom.hotkeyList.appendChild(row);
      });
      const buttons = dom.hotkeyList.querySelectorAll('button[data-action]');
      buttons.forEach(btn => btn.addEventListener('click', () => startRecording(btn)));
      if (focusFirst) {
        const firstBtn = buttons[0];
        if (firstBtn) firstBtn.focus();
      }
    }

    function startRecording(btn) {
      const listEl = dom.hotkeyList;
      if (!listEl) return;
      const label = btn.dataset.action;
      const working = getWorkingHotkeys();
      const prev = working[label];
      if (activeRecorderCleanup) activeRecorderCleanup(false);
      const texts = state?.current?.texts;
      btn.textContent = texts?.ui?.pressKeys || 'Press keys...';
      btn.classList.add('is-recording');
      btn.disabled = true;
      dom.hotkeyList.setAttribute('data-recording', 'true');
      suspendHotkeys(true);
      const finish = combo => {
        const sanitized = sanitizeAccelerator(combo, prev);
        if (sanitized === prev) {
          cleanup(false);
          return;
        }
        cleanup(true);
        const next = { ...working, [label]: sanitized };
        const active = getActiveHotkeys();
        const changed = !mapsEqual(next, active);
        setDraft(changed ? next : null);
        markDirty(changed);
        renderHotkeyList();
      };
      const cancel = () => cleanup(false);
      const keyHandler = ev => {
        ev.preventDefault();
        if (ev.key === 'Escape') return cancel();
        const combo = comboFromEvent(ev);
        finish(combo);
      };
      function cleanup(apply) {
        document.removeEventListener('keydown', keyHandler, true);
        activeRecorderCleanup = null;
        btn.classList.remove('is-recording');
        btn.disabled = false;
        dom.hotkeyList.removeAttribute('data-recording');
        suspendHotkeys(false);
        if (!apply) {
          btn.textContent = prev;
          btn.focus();
        }
      }
      activeRecorderCleanup = cleanup;
      setTimeout(() => document.addEventListener('keydown', keyHandler, true), 0);
    }

    function handleGlobalKeydown(ev) {
      if (dom.hotkeyList?.getAttribute('data-recording') === 'true') return;
      const active = getActiveHotkeys();
      const combo = sanitizeAccelerator(comboFromEvent(ev), null);
      if (!combo) return;
      Object.entries(active).forEach(([label, key]) => {
        if (combo === key) performActionLabel(label);
      });
    }

    function openModal() {
      if (!dom.hotkeyModal) return;
      dom.hotkeyModal.style.display = 'flex';
      dom.hotkeyModal.setAttribute('aria-hidden', 'false');
      suspendHotkeys(false);
      dom.hotkeyList?.removeAttribute('data-recording');
      setDraft(null);
      markDirty(false);
      renderHotkeyList({ focusFirst: true });
    }
    function closeModal(discardChanges = true) {
      if (!dom.hotkeyModal) return;
      if (activeRecorderCleanup) activeRecorderCleanup(false);
      if (discardChanges) {
        setDraft(null);
        markDirty(false);
      }
      dom.hotkeyModal.style.display = 'none';
      dom.hotkeyModal.setAttribute('aria-hidden', 'true');
      dom.hotkeyList?.removeAttribute('data-recording');
      suspendHotkeys(false);
    }

    function init() {
      if (!dom.hotkeyMenuBtn || !dom.hotkeyModal || !dom.hotkeyList) return;
      const stored = getStoredHotkeys();
      if (stored) {
        const sanitized = buildHotkeyMap(stored);
        if (JSON.stringify(stored) !== JSON.stringify(sanitized))
          localStorage.setItem(HOTKEY_STORAGE_KEY, JSON.stringify(sanitized));
      }
      dom.hotkeyMenuBtn.addEventListener('click', openModal);
      dom.closeHotkeyModal?.addEventListener('click', () => closeModal(true));
      dom.hotkeyCloseIcon?.addEventListener('click', () => closeModal(true));
      dom.hotkeySaveBtn?.addEventListener('click', () => {
        if (activeRecorderCleanup) activeRecorderCleanup(false);
        if (!draft) return;
        setCustomHotkeys(draft);
        setDraft(null);
        markDirty(false);
        renderHotkeyList();
        closeModal(false);
      });
      dom.resetHotkeysBtn?.addEventListener('click', () => {
        if (activeRecorderCleanup) activeRecorderCleanup(false);
        const active = getActiveHotkeys();
        const changed = !mapsEqual(defaultHotkeys, active);
        setDraft(changed ? defaultHotkeys : null);
        markDirty(changed);
        renderHotkeyList();
      });
      window.addEventListener('keydown', handleGlobalKeydown);
      try {
        window.app?.finder?.onRequestActiveSeed?.(() => performActionId(ACTION.SEND_TO_OVERLAY));
      } catch (error) {
        devWarn('[finder:hotkeys] Failed to register active seed listener', error);
      }
      markDirty(false);
    }

    return { 
      init,
    };
  }

  runtime.createHotkeyController = createHotkeyController;
})();
