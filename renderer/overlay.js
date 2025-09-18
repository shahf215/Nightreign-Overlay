(() => {
  'use strict';

  const BASE = {
    fontPx: 12,
    labelPad: 12,
    labelH: 16,
    bgAlpha: 0.5,
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
  const dprSetupCanvas = window.dprSetupCanvas;
  const uvToScreen = window.uvToScreen;
  const getUIScale = window.getUIScale;
  const getSurfaceRect = window.getSurfaceRect;

  let poiUV = [];
  let idToUV = new Map();
  let activePattern = null;
  let panelPxRect = null;
  let debug = false;

  async function loadData() {
    const res = await fetch('../assets/data/poi_uv_with_ids.json');
    const uv = await res.json();
    poiUV = Array.isArray(uv) ? uv : [];
    idToUV = new Map(poiUV.map(u => [u.id, u]));
  }

  function clear() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  function drawLabel(x, y, text, styleKey, ui) {
    ctx.save();
    ctx.font = `${ui.fontPx}px ui-sans-serif`;
    ctx.textAlign = 'center';

    const color = BASE.colors[styleKey] || BASE.colors.default;
    const w = ctx.measureText(text).width + ui.labelPad * 2;
    const h = ui.labelH;

    ctx.fillStyle = `rgba(0, 0, 0, ${ui.bgAlpha})`;
    ctx.fillRect(x - w / 2, y - h / 2 + 2, w, h);

    ctx.fillStyle = color;
    ctx.fillText(text, x, y + 2 + (ui.fontPx * 0.35));
    ctx.restore();
  }

  function drawPoi(poiId, text, styleKey, ui) {
    if (!poiId || !text) return;
    const rec = idToUV.get(poiId);
    if (!rec || !rec.uv) return;
    const [u, v] = rec.uv;
    const { x, y } = uvToScreen(panelPxRect, u, v);
    drawLabel(x, y, text, styleKey, ui);
  }

  function render() {
    if (typeof dprSetupCanvas !== 'function') {
      console.error(
        '[overlay] dprSetupCanvas missing — ensure uv_runtime.js is loaded before overlay.js'
      );
      return;
    }

    dprSetupCanvas(canvas, ctx);

    const W = window.innerWidth, H = window.innerHeight;
    const surfaceRectPx = getSurfaceRect(W, H);

    panelPxRect = getPanelRect(surfaceRectPx);

    const s = getUIScale(surfaceRectPx);
    const ui = {
      fontPx: Math.max(8, Math.round(BASE.fontPx * s)),
      labelPad: Math.max(4, Math.round(BASE.labelPad * s)),
      labelH: Math.max(12, Math.round(BASE.labelH * s)),
      bgAlpha: BASE.bgAlpha,
    };

    clear();

    if (!activePattern) return;

    const p = activePattern.pattern;

    if (debug) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(panelPxRect.x, panelPxRect.y, panelPxRect.width, panelPxRect.height);
      ctx.restore();
    }

    if (p.night1?.poi_id && p.night1.boss !== 'empty') {
      drawPoi(p.night1.poi_id, 'Night 1: ' + p.night1.boss, 'night', ui);
    }
    if (p.night2?.poi_id && p.night2.boss !== 'empty') {
      drawPoi(p.night2.poi_id, 'Night 2: ' + p.night2.boss, 'night', ui);
    }

    for (const eg of p.evergaols || []) {
      if (eg.poi_id && eg.boss !== 'empty') drawPoi(eg.poi_id, eg.boss, 'evergaol', ui);
    }

    for (const fb of p.field_bosses || []) {
      if (fb.poi_id && fb.boss !== 'empty') drawPoi(fb.poi_id, fb.boss, 'field-boss', ui);
    }

    if (Array.isArray(p.special_events)) {
      const extra = (p.extra_night_boss || '').trim();
      const hasExtra = !!extra && extra.toLowerCase() !== 'empty';

      for (const ev of p.special_events) {
        if (!ev || !ev.poi_id) continue;
        const base = (ev.event || '').trim();
        if (!base && !hasExtra) continue;

        const text = hasExtra ? (base ? `${base} — ${extra}` : extra) : base;
        drawPoi(ev.poi_id, text, 'event', ui);
      }
    }

    if (Array.isArray(p.sorcerers_rises)) {
      for (const sr of p.sorcerers_rises) {
        if (sr.poi_id && sr.value) {
          const display = sr.value.startsWith(SORC_PREFIX)
            ? sr.value.substring(SORC_PREFIX.length)
            : sr.value;
          drawPoi(sr.poi_id, display, 'sorcerer-rise', ui);
        }
      }
    }

    if (Array.isArray(p.castle)) {
      for (const c of p.castle) {
        if (c.poi_id && c.boss && c.boss !== 'empty') {
          drawPoi(c.poi_id, c.boss, 'castle-boss', ui);
        }
      }
    }
  }

  let offReset = null;
  let offSeed = null;

  offReset = window.overlayAPI?.onReset?.(() => {
    activePattern = null;
    panelPxRect = null;
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
