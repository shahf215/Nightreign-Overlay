(() => {
  const runtime = (window.OverlayRuntime = window.OverlayRuntime || {});

  function deriveUiMetrics({ overlayPrefs, labelBaseStyle, scale }) {
    const effectiveScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    const fontPref = overlayPrefs?.fontSize ?? labelBaseStyle.fontPx;
    const offsetXPref = overlayPrefs?.offsetX ?? 0;
    const offsetYPref = overlayPrefs?.offsetY ?? 0;

    return {
      fontPx: Math.max(8, Math.round((fontPref || labelBaseStyle.fontPx) * effectiveScale)),
      labelPad: Math.max(4, Math.round(labelBaseStyle.labelPad * effectiveScale)),
      labelH: Math.max(12, Math.round(labelBaseStyle.labelH * effectiveScale)),
      bgAlpha: labelBaseStyle.bgAlpha,
      offsetX: Math.round(offsetXPref * effectiveScale),
      offsetY: Math.round(offsetYPref * effectiveScale),
    };
  }

  runtime.uiState = {
    deriveUiMetrics,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runtime.uiState;
  }
})();
