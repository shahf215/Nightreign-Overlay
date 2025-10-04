(() => {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const I18N = root.I18N || {};
  const SeedfinderI18N = (root.SeedfinderI18N = root.SeedfinderI18N || {});

  let d = {};
  let base = 'public';
  const files = ['shifting_earth_labels', 'events_labels', 'nightlords'];

  function shouldLogDev() {
    if (typeof localStorage === 'undefined') return false;
    try {
      return Boolean(localStorage.getItem('dev'));
    } catch {
      return false;
    }
  }

  SeedfinderI18N.init = async function initFinderDomain(lang) {
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
        console.warn('[finder:i18n] domain load failed', error);
      }
    }
  };

  SeedfinderI18N.shiftingEarthLabel = v => I18N.lookup(d['shifting_earth_labels'], v);
  SeedfinderI18N.eventLabel = v => I18N.lookup(d['events_labels'], v);
  SeedfinderI18N.nightlordLabel = v => I18N.lookup(d['nightlords'], v);
})();
