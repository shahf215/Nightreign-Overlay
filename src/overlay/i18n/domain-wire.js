(() => {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const I18N = root.I18N || {};
  const OverlayI18N = (root.OverlayI18N = root.OverlayI18N || {});

  let d = {};
  let base = 'public';
  let ui = {};
  const files = [
    'overlay_poi_values',
    'overlay_locations',
    'shifting_earth_labels',
    'events_labels',
    'nightlords',
    'boss_castle',
    'boss_evergaol',
    'boss_field',
    'boss_night',
    'boss_other',
    'ui_poiOptions',
    'ui_overlayOptions',
    'ui_filterOptions',
    'ui_filters',
    'ui_categories',
    'ui_generic',
  ];

  function shouldLogDev() {
    if (typeof localStorage === 'undefined') return false;
    try {
      return Boolean(localStorage.getItem('dev'));
    } catch {
      return false;
    }
  }

  async function fetchUiBundle(b, lang) {
    try {
      const res = await fetch(`${b}/locales/${lang}.json`, { cache: 'no-store' });
      if (!res || !res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  OverlayI18N.init = async function initOverlayDomain(lang) {
    const probes = ['..', '../..', 'public'];
    for (const candidate of probes) {
      {
        try {
          const probe = await fetch(`${candidate}/locales/en.json`, { cache: 'no-store' });
          if (probe && probe.ok) {
            base = candidate;
            break;
          }
        } catch {}
      }
    }

    try {
      d = await I18N.domainLoad(lang || 'en', base, files);
    } catch (error) {
      d = {};
      if (shouldLogDev()) {
        console.warn('[overlay:i18n] domain load failed', error);
      }
    }

    const target = lang || 'en';
    const primary = await fetchUiBundle(base, target);
    if (primary) {
      ui = primary;
      return;
    }

    const fallback = target === 'en' ? null : await fetchUiBundle(base, 'en');
    ui = fallback || {};
    if (!primary && !fallback && shouldLogDev()) {
      console.warn('[overlay:i18n] Missing UI locale bundle', target);
    }
  };

  OverlayI18N.poiLabel = v => I18N.lookup(d['overlay_poi_values'], v);
  OverlayI18N.locationLabel = v => I18N.lookup(d['overlay_locations'], v);
  OverlayI18N.shiftingEarthLabel = v => I18N.lookup(d['shifting_earth_labels'], v);
  OverlayI18N.eventLabel = v => I18N.lookup(d['events_labels'], v);
  OverlayI18N.nightlordLabel = v => I18N.lookup(d['nightlords'], v);
  OverlayI18N.bossLabel = (type, name) => {
    const key = `boss_${type}`;
    return I18N.lookup(d[key], name);
  };
  OverlayI18N.tUI = (name, fallback) => I18N.lookup(d['ui_generic'], name) || fallback || name;
  OverlayI18N.tUILabel = (key, fallback) => {
    const val = ui && ui.ui ? ui.ui[key] : undefined;
    if (typeof val === 'string' && val) return val;

    const probe = fallback || key;
    const viaDomain = I18N.lookup(d['ui_generic'], probe);
    return viaDomain || probe;
  };
  OverlayI18N.labelPoi = item => {
    const n = OverlayI18N.poiLabel(item?.value);
    const w = OverlayI18N.locationLabel(item?.location);
    return `${n} - ${w}`;
  };
})();
