(function () {
  const Seedfinder = (window.Seedfinder = window.Seedfinder || {});

  function initOverlayOptions() {
    const defaultPrefs = {
      overlay_showNight: 'true',
      overlay_showEvergaol: 'true',
      overlay_showFieldBoss: 'true',
      overlay_showEvent: 'true',
      overlay_showSorcererRise: 'true',
      overlay_showCastle: 'true',
      overlay_showRuins: 'true',
      overlay_showGreatChurches: 'true',
      overlay_showForts: 'true',
      overlay_showCamps: 'true',
      overlay_showCaravans: 'true',
      overlay_showChurches: 'true',
      overlay_showTownships: 'true',
      overlay_color_night: '#ffffff',
      overlay_color_evergaol: '#3b82f6',
      overlay_color_field_boss: '#ef4444',
      overlay_color_event: '#f59e0b',
      overlay_color_sorcerer_rise: '#a855f7',
      overlay_color_ruins: '#f97316',
      overlay_color_great_church: '#06b6d4',
      overlay_color_fort: '#ef4444',
      overlay_color_camp: '#8b5cf6',
      overlay_color_caravan: '#f59e0b',
      overlay_color_castle_boss: '#10b981',
      overlay_color_church: '#60a5fa',
      overlay_color_township: '#84cc16',
      overlay_fontSize: '12',
      overlay_offsetX: '0',
      overlay_offsetY: '0',
      overlay_scale: '1',
    };

    const mapping = {
      optShowNight: 'overlay_showNight',
      optShowEvergaol: 'overlay_showEvergaol',
      optShowFieldBoss: 'overlay_showFieldBoss',
      optShowEvent: 'overlay_showEvent',
      optShowSorcererRise: 'overlay_showSorcererRise',
      optShowCastle: 'overlay_showCastle',
      optShowRuins: 'overlay_showRuins',
      optShowGreatChurches: 'overlay_showGreatChurches',
      optShowChurches: 'overlay_showChurches',
      optShowTownships: 'overlay_showTownships',
      optShowForts: 'overlay_showForts',
      optShowCamps: 'overlay_showCamps',
      optShowCaravans: 'overlay_showCaravans',
      optColorNight: 'overlay_color_night',
      optColorEvergaol: 'overlay_color_evergaol',
      optColorFieldBoss: 'overlay_color_field_boss',
      optColorEvent: 'overlay_color_event',
      optColorSorcererRise: 'overlay_color_sorcerer_rise',
      optColorRuins: 'overlay_color_ruins',
      optColorGreatChurches: 'overlay_color_great_church',
      optColorChurches: 'overlay_color_church',
      optColorTownships: 'overlay_color_township',
      optColorForts: 'overlay_color_fort',
      optColorCamps: 'overlay_color_camp',
      optColorCaravans: 'overlay_color_caravan',
      optColorCastle: 'overlay_color_castle_boss',
      optFontSize: 'overlay_fontSize',
      optOffsetX: 'overlay_offsetX',
      optOffsetY: 'overlay_offsetY',
      optScale: 'overlay_scale',
    };

    const getPref = key => {
      const value = localStorage.getItem(key);
      return value !== null ? value : defaultPrefs[key];
    };

    Object.entries(mapping).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const value = getPref(key);
      if (el.type === 'checkbox') {
        el.checked = value === 'true';
      } else {
        el.value = value;
      }
      el.addEventListener('input', () => {
        let newValue;
        if (el.type === 'checkbox') {
          newValue = el.checked ? 'true' : 'false';
        } else {
          newValue = el.value;
        }
        localStorage.setItem(key, newValue);
      });
    });
  }

  Seedfinder.overlayPrefs = {
    initOverlayOptions,
  };
})();
