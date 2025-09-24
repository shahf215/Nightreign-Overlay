(() => {
  'use strict';

  const NL_ORDER = [
    'Gladius',
    'Adel',
    'Gnoster',
    'Maris',
    'Libra',
    'Fulghor',
    'Caligo',
    'Heolstor',
  ];
  const MAP_ORDER = ['Default', 'Mountaintop', 'Crater', 'Rotted Woods', 'Noklateo'];

  const SHOW_ONLY_USED = false;

  const ICON_SIZE = 38;

  const nlBtns = document.getElementById('nlBtns');
  const mapBtns = document.getElementById('mapBtns');
  const statusEl = document.getElementById('status');
  const countEl = document.getElementById('count');
  const candEl = document.getElementById('cand');
  const sendBtn = document.getElementById('send');
  const resetBtn = document.getElementById('reset');

  const canvas = document.getElementById('mapCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  window.dprSetupCanvas(canvas, ctx);

  const mapBackgrounds = window.MAP_BACKGROUNDS;
  const poisByMap = window.POIS_BY_MAP;

  let currentBoss = null;
  let currentMap = null;
  let recentPattern = null;

  const finderMapImage = new Image();
  let poiCoords = [];
  let allPatterns = [];
  let filteredPatterns = [];
  let nodesByPattern = new Map();
  let mapNodes = [];
  let nodeSelections = {};
  let idToUV = null;

  const iconChurch = new Image();
  iconChurch.src = '../assets/images/seedfinderIcons/church-icon.png';
  const iconRise = new Image();
  iconRise.src = '../assets/images/seedfinderIcons/sorcerers-rise-icon.png';

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`[seed] fetch failed ${res.status} ${url}`);
    return res.json();
  }

  function loadImage(img, src) {
    return new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = e => reject(e);
      img.src = src;
    });
  }

  function setStatus(t) {
    statusEl.textContent = t;
  }

  async function loadData() {
    const poiUV = await fetchJson('../assets/data/poi_uv_with_ids.json');
    idToUV = new Map(poiUV.map(p => [p.id, p.uv]));
    const list = await fetchJson('../assets/data/nightlords.json');
    for (const n of NL_ORDER) {
      if (list.includes(n)) {
        const b = document.createElement('button');
        b.textContent = n;
        b.onclick = async () => {
          try {
            await selectNightlord(n);
          } catch (err) {
            console.error('[seed] selectNightlord', err);
          }
        };
        nlBtns.appendChild(b);
      }
    }

    for (const m of MAP_ORDER) {
      const b = document.createElement('button');
      b.textContent = m;
      b.onclick = async () => {
        try {
          await selectMap(m);
        } catch (err) {
          console.error('[seed] selectMap', err);
        }
      };
      mapBtns.appendChild(b);
    }
  }

  async function selectNightlord(nl) {
    window.electronAPI?.overlay?.reset?.();
    currentBoss = nl;
    setStatus('Boss: ' + nl + (currentMap ? ' | Map: ' + currentMap : ''));

    for (const btn of nlBtns.querySelectorAll('button')) {
      btn.classList.toggle('active', btn.textContent === nl);
    }

    const safe = nl.replace(/[^A-Za-z0-9_-]+/g, '_');
    const list = await fetchJson(`../assets/data/patterns_by_nightlord/${safe}.json`);
    allPatterns = Array.isArray(list) ? list : [];
    filterPatterns();
    resolvePatternNodes();
    clearNodeSelection();
    renderFinderMap();
    prunePatterns();
  }
  async function selectMap(name) {
    window.electronAPI?.overlay?.reset?.();
    currentMap = name;
    setStatus(currentBoss ? 'Boss: ' + currentBoss + ' | Map: ' + name : 'Map: ' + name);

    for (const btn of mapBtns.querySelectorAll('button')) {
      btn.classList.toggle('active', btn.textContent === name);
    }

    const src = mapBackgrounds[name] || mapBackgrounds['Default'];
    await loadImage(finderMapImage, src);
    filterPatterns();
    resolvePatternNodes();
    clearNodeSelection();
    renderFinderMap();
    prunePatterns();
  }

  function filterPatterns() {
    if (!currentMap) {
      filteredPatterns = [];
      return;
    }
    filteredPatterns = allPatterns.filter(p => (p.shifting_earth || 'Default') === currentMap);
  }

  function getNearestNode(pt, nodes) {
    let best = null,
      bd = Infinity;
    for (const n of nodes) {
      const d = Math.hypot(pt.x - n.x, pt.y - n.y);
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return { best, bd };
  }

  function createFinderMap(u, v, W = 768, H = 768) {
    const [x, y] = window.uvToSeedFinder({ x: 0, y: 0, width: W, height: H }, u, v);
    return { x, y };
  }

  function buildPoiToNodeMap() {
    const map = new Map();
    if (!currentMap) return map;

    const base = poisByMap[currentMap] || [];
    const usedPoi = new Set();
    for (const p of filteredPatterns) {
      for (const ch of p.churches || []) {
        if (ch.poi_id != null) usedPoi.add(ch.poi_id);
      }
      for (const sr of p.sorcerers_rises || []) {
        if (sr.poi_id != null) usedPoi.add(sr.poi_id);
      }
    }

    for (const poiId of usedPoi) {
      const uv = idToUV?.get(poiId);
      if (!uv) continue;
      const pt = createFinderMap(uv[0], uv[1]);
      const { best } = getNearestNode(pt, base);
      if (best) map.set(poiId, best.id);
    }
    return map;
  }

  function resolvePatternNodes() {
    const base = poisByMap[currentMap] || [];
    if (!currentMap) {
      mapNodes = [];
      nodesByPattern.clear();
      return;
    }

    nodesByPattern.clear();
    const poi2node = buildPoiToNodeMap();
    const used = new Set();

    for (const pat of filteredPatterns) {
      const tbl = {};
      for (const n of base) tbl[n.id] = null;

      for (const ch of pat.churches || []) {
        const uv = idToUV?.get(ch.poi_id);
        if (!uv) continue;
        let nid = poi2node.get(ch.poi_id);
        if (nid == null) {
          const p = createFinderMap(uv[0], uv[1]);
          const { best } = getNearestNode(p, base);
          nid = best?.id;
        }
        if (nid != null) {
          tbl[nid] = 'Church';
          used.add(nid);
        }
      }

      for (const sr of pat.sorcerers_rises || []) {
        const uv = idToUV?.get(sr.poi_id);
        if (!uv) continue;
        let nid = poi2node.get(sr.poi_id);
        if (nid == null) {
          const p = createFinderMap(uv[0], uv[1]);
          const { best } = getNearestNode(p, base);
          nid = best?.id;
        }
        if (nid != null) {
          tbl[nid] = 'Rise';
          used.add(nid);
        }
      }

      nodesByPattern.set(pat.layout_number, tbl);
    }

    if (SHOW_ONLY_USED) {
      const subset = base.filter(n => used.has(n.id));
      mapNodes = subset.length ? subset : base;
    } else {
      mapNodes = base;
    }
  }

  function clearNodeSelection() {
    nodeSelections = {};
    for (const n of mapNodes) {
      nodeSelections[n.id] = 'dot';
    }
  }

  function renderFinderMap() {
    ctx.clearRect(0, 0, 768, 768);
    if (finderMapImage && finderMapImage.complete) ctx.drawImage(finderMapImage, 0, 0, 768, 768);

    for (const n of mapNodes) {
      const st = nodeSelections[n.id];
      if (st === 'church') {
        ctx.drawImage(iconChurch, n.x - ICON_SIZE / 2, n.y - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE);
      } else if (st === 'mage') {
        ctx.drawImage(iconRise, n.x - ICON_SIZE / 2, n.y - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE);
      } else {
        ctx.beginPath();
        ctx.arc(n.x, n.y, ICON_SIZE / 2, 0, Math.PI * 2);
        ctx.fillStyle = st === 'unknown' ? 'gray' : 'orange';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (st === 'unknown') {
          ctx.fillStyle = 'black';
          ctx.font = 'bold 12px ui-sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', n.x, n.y);
        }
      }
    }
  }

  function prunePatterns() {
    const kept = [];

    for (const p of filteredPatterns) {
      const tbl = nodesByPattern.get(p.layout_number) || {};
      let ok = true;

      for (const [nid, st] of Object.entries(nodeSelections)) {
        if (st === 'dot') continue;
        const req = tbl[nid] || null;

        if (st === 'church' && req !== 'Church') {
          ok = false;
          break;
        }
        if (st === 'mage' && req !== 'Rise') {
          ok = false;
          break;
        }
        if (st === 'unknown' && (req === 'Church' || req === 'Rise')) {
          ok = false;
          break;
        }
      }

      if (ok) kept.push(p);
    }

    candEl.innerHTML = '';
    countEl.textContent = `(${kept.length})`;

    for (const k of kept.slice(0, 60)) {
      const li = document.createElement('li');
      li.textContent = 'Layout ' + k.layout_number;
      candEl.appendChild(li);
    }

    sendBtn.disabled = kept.length !== 1;

    if (kept.length === 1) {
      const payload = {
        nightlord: currentBoss,
        layout_number: kept[0].layout_number,
        pattern: kept[0],
      };
      recentPattern = payload;
      window.seedAPI.sendSelected(payload);
    }

    setStatus(
      currentBoss && currentMap
        ? `Boss: ${currentBoss} | Map: ${currentMap} | ${kept.length} candidates`
        : 'Pick a Nightlord & Map.'
    );
  }

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('mousedown', e => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left,
      y = e.clientY - r.top;

    let hit = null;
    for (const n of mapNodes) {
      if (
        x >= n.x - ICON_SIZE / 2 &&
        x <= n.x + ICON_SIZE / 2 &&
        y >= n.y - ICON_SIZE / 2 &&
        y <= n.y + ICON_SIZE / 2
      ) {
        hit = n;
        break;
      }
    }

    if (!hit) {
      const { best } = getNearestNode({ x, y }, mapNodes);
      if (best && Math.hypot(x - best.x, y - best.y) <= ICON_SIZE) hit = best;
    }

    if (hit) {
      if (e.button === 0) nodeSelections[hit.id] = 'church';
      else if (e.button === 2) nodeSelections[hit.id] = 'mage';
      else if (e.button === 1) nodeSelections[hit.id] = 'unknown';
      renderFinderMap();
      prunePatterns();
    }
  });

  resetBtn.addEventListener('click', () => {
    clearNodeSelection();
    renderFinderMap();
    prunePatterns();

    window.electronAPI?.overlay?.reset?.();
  });
  
  sendBtn.addEventListener('click', () => {
    if (recentPattern) {
      window.seedAPI.sendSelected(recentPattern);
    } else {
      prunePatterns();
    }
  });

  loadData();
})();
