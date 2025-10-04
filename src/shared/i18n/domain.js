(() => {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const I18N = (root.I18N = root.I18N || {});

  function shouldLogDev() {
    if (typeof localStorage === 'undefined') return false;
    try {
      return Boolean(localStorage.getItem('dev'));
    } catch {
      return false;
    }
  }

  async function fetchDomainChunk(base, lang, name) {
    try {
      const res = await fetch(`${base}/locales/domain/${lang}/${name}.json`, {
        cache: 'no-store',
      });
      if (!res || !res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function domainLoad(lang, base, names) {
    const out = {};
    const target = lang || 'en';

    for (const name of names) {
      const primary = await fetchDomainChunk(base, target, name);
      if (primary) {
        out[name] = primary;
        continue;
      }

      const fallback = target === 'en' ? null : await fetchDomainChunk(base, 'en', name);
      if (fallback) {
        out[name] = fallback;
        continue;
      }

      out[name] = {};
      if (shouldLogDev()) {
        console.warn(`[i18n] Missing domain dictionary: ${target}/${name}`);
      }
    }

    return out;
  }

  function lookup(map, key) {
    if (!map) return key;
    const k = typeof key === 'string' ? key : String(key);
    return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : k;
  }

  I18N.domainLoad = domainLoad;
  I18N.lookup = lookup;
})();
