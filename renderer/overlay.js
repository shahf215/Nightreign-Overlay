(() => {
  'use strict';

  const CONFIG = {
    font: '10px ui-sans-serif',
    labelPad: 8,
    labelH: 18,
    xOffset: 14,
    shiftTop: 14,
    shiftBottom: 20,
    colors: {
      evergaol: '#3b82f6',
      'field-boss': '#ef4444',
      night: '#ffffff',
      event: '#f59e0b',
      'sorcerer-rise': '#a855f7',
      'castle-boss': '#10b981',
      default: '#ffffff',
    },
  };
  const SORC_PREFIX = "Sorcerer's Rise - ";

  const canvas = document.getElementById('c');
  if (!canvas) {
    console.error("[overlay] <canvas id='c'> not found.");
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  const getPanelRect = window.getPanelRect;
  const uvToScreen = window.uvToScreen;
  const dprSetupCanvas = window.dprSetupCanvas;

  let POI_UV = [];
  let idToUV = new Map();
  let activePattern = null;
  let panelRect = null;
  let debug = false;

  async function loadData() {
    const res = await fetch('../assets/data/poi_uv_with_ids.json');
    const uv = await res.json();
    POI_UV = Array.isArray(uv) ? uv : [];
    idToUV = new Map(POI_UV.map(u => [u.id, u]));
  }

  function clear() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  function label(x, y, text, className) {
    ctx.save();
    ctx.font = CONFIG.font;
    ctx.textAlign = 'center';

    const color = CONFIG.colors[className] || CONFIG.colors.default;
    const w = ctx.measureText(text).width + CONFIG.labelPad * 2;
    const h = CONFIG.labelH;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x - w / 2, y - h / 2 + 2, w, h);

    ctx.fillStyle = color;
    ctx.fillText(text, x, y + 5);
    ctx.restore();
  }

  function posFromUV(poiId, rect) {
    const rec = idToUV.get(poiId);
    if (!rec || !rec.uv) return null;
    const [u, v] = rec.uv;
    const [X, Y] = uvToScreen(rect, u, v);
    return { x: X, y: Y };
  }

  function drawPoi(poiId, text, className) {
    if (!poiId || !text) return;
    const pos = posFromUV(poiId, panelRect);
    if (!pos) return;

    const midY = panelRect.y + panelRect.height / 2;
    const shift = pos.y < midY ? CONFIG.shiftTop : CONFIG.shiftBottom;

    label(pos.x + CONFIG.xOffset, pos.y + shift + 20, text, className);
  }

  function render() {
    if (typeof dprSetupCanvas !== 'function') {
      console.error(
        '[overlay] dprSetupCanvas missing — ensure uv_runtime.js is loaded before overlay.js'
      );
      return;
    }
    dprSetupCanvas(canvas, ctx);
    panelRect = getPanelRect();

    clear();

    if (!activePattern) return;

    const p = activePattern.pattern;

    if (debug) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(panelRect.x, panelRect.y, panelRect.width, panelRect.height);
      ctx.restore();
    }

    if (p.night1?.poi_id && p.night1.boss !== 'empty') {
      drawPoi(p.night1.poi_id, 'Night 1: ' + p.night1.boss, 'night');
    }
    if (p.night2?.poi_id && p.night2.boss !== 'empty') {
      drawPoi(p.night2.poi_id, 'Night 2: ' + p.night2.boss, 'night');
    }

    for (const eg of p.evergaols || []) {
      if (eg.poi_id && eg.boss !== 'empty') drawPoi(eg.poi_id, eg.boss, 'evergaol');
    }

    for (const fb of p.field_bosses || []) {
      if (fb.poi_id && fb.boss !== 'empty') drawPoi(fb.poi_id, fb.boss, 'field-boss');
    }

    if (Array.isArray(p.special_events)) {
      const extra = (p.extra_night_boss || '').trim();
      const hasExtra = !!extra && extra.toLowerCase() !== 'empty';

      for (const ev of p.special_events) {
        if (!ev || !ev.poi_id) continue;
        const base = (ev.event || '').trim();
        if (!base && !hasExtra) continue;

        const text = hasExtra ? (base ? `${base} — ${extra}` : extra) : base;
        drawPoi(ev.poi_id, text, 'event');
      }
    }

    if (Array.isArray(p.sorcerers_rises)) {
      for (const sr of p.sorcerers_rises) {
        if (sr.poi_id && sr.value) {
          const display = sr.value.startsWith(SORC_PREFIX)
            ? sr.value.substring(SORC_PREFIX.length)
            : sr.value;
          drawPoi(sr.poi_id, display, 'sorcerer-rise');
        }
      }
    }

    if (Array.isArray(p.castle)) {
      for (const c of p.castle) {
        if (c.poi_id && c.boss && c.boss !== 'empty') {
          drawPoi(c.poi_id, c.boss, 'castle-boss');
        }
      }
    }
  }

  let offReset = null;
  let offSeed = null;

  offReset = window.overlayAPI?.onReset?.(() => {
    activePattern = null;
    panelRect = null;
    render();
  });
  offSeed = window.overlayAPI?.onSeedSelected?.(payload => {
    activePattern = payload;
    render();
  });

  window.addEventListener('beforeunload', () => {
    offReset?.();
    offSeed?.();
  });

  addEventListener('resolution-changed', render);
  addEventListener('panelnorm-changed', render);
  addEventListener('resize', render);
  addEventListener('pattern-changed', render);

  async function boot() {
    try {
      await loadData();
      render();
    } catch (err) {
      console.error('[overlay] Failed to load data:', err);
    }
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();

  const Loop = {
    emit(evt) {
      if (evt === 'HIDE_OVERLAY') window.electronAPI.overlay.hideOverlay();
      if (evt === 'TOGGLE_OVERLAY') window.electronAPI.overlay.toggleOverlay();
    },
  };

  GamepadInput.start(Loop);
})();
