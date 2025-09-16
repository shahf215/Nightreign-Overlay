(function (global) {

  window.dprSetupCanvas = function dprSetupCanvas(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return dpr;
  };

  const REF_PANEL_NORM = { x: 0.567871, y: 0.150174, width: 0.387695, height: 0.676215 };

  const RES_PRESETS = {
    "3840x2160": { w: 3840, h: 2160 },
    "2560x1440": { w: 2560, h: 1440 },
    "2160x1440": { w: 2160, h: 1440 },
    "1920x1080": { w: 1920, h: 1080 }
  };

  function getResKey() {
    return localStorage.getItem("overlay.resolution") || "auto";
  }
  function setResolutionKey(k) {
    localStorage.setItem("overlay.resolution", k);
    window.dispatchEvent(new CustomEvent("resolution-changed", { detail: k }));
  }

  function savePanelNormFor(resKey, norm) {
    localStorage.setItem(`overlay.panelNorm.${resKey}`, JSON.stringify(norm));
    window.dispatchEvent(new Event("panelnorm-changed"));
  }
  function loadPanelNormFor(resKey) {
    try {
      const raw = localStorage.getItem(`overlay.panelNorm.${resKey}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  function getVirtualSurfaceRect(resKey) {

    const W = window.innerWidth,H = window.innerHeight;
    const preset = RES_PRESETS[resKey];

    if (!preset) {
      return { x: 0, y: 0, width: W, height: H };
    }

    const sx = W / preset.w,sy = H / preset.h;
    const s = Math.min(sx, sy);
    const vw = Math.round(preset.w * s);
    const vh = Math.round(preset.h * s);
    const vx = Math.round((W - vw) / 2);
    const vy = Math.round((H - vh) / 2);

    return { x: vx, y: vy, width: vw, height: vh };
  }

  function panelNormToPixels(norm, surface) {
    return {
      x: Math.round(surface.x + norm.x * surface.width),
      y: Math.round(surface.y + norm.y * surface.height),
      width: Math.round(norm.width * surface.width),
      height: Math.round(norm.height * surface.height)
    };
  }

  function detectPanelRect(surface) {
    if (typeof window.detectMapPanel !== "function") return null;
    try {
      const r = window.detectMapPanel();
      if (!r || !r.width || !r.height) return null;

      const x2 = r.x + r.width,y2 = r.y + r.height;
      const sx2 = surface.x + surface.width,sy2 = surface.y + surface.height;
      const overlap = !(x2 < surface.x || r.x > sx2 || y2 < surface.y || r.y > sy2);
      if (!overlap) return null;
      return r;
    } catch {return null;}
  }

  function getPanelRect() {
    const resKey = getResKey();
    const surface = getVirtualSurfaceRect(resKey);

    if (resKey === "auto") {
      const d = detectPanelRect(surface);
      if (d) return d;
    }

    const norm = loadPanelNormFor(resKey) || REF_PANEL_NORM;
    return panelNormToPixels(norm, surface);
  }

  function dprSetupCanvas(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth,H = window.innerHeight;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function uvToScreen(panelRect, u, v) {
    return [panelRect.x + u * panelRect.width, panelRect.y + v * panelRect.height];
  }

  global.getPanelRect = getPanelRect;
  global.dprSetupCanvas = dprSetupCanvas;
  global.uvToScreen = uvToScreen;
  global.setResolutionKey = setResolutionKey;
  global.loadPanelNormFor = loadPanelNormFor;
})(window);
