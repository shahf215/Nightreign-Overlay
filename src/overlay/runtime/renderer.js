(() => {
  const runtime = (window.OverlayRuntime = window.OverlayRuntime || {});

  function clearCanvas(ctx, width, height) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
  }

  function drawLabel(ctx, x, y, text, styleKey, ui, { getStyleColor, wrapLabelText }) {
    if (!ctx || !ui) return;
    const lines = wrapLabelText ? wrapLabelText(text, 26) : [text];

    ctx.save();
    ctx.font = `${ui.fontPx}px ui-sans-serif, system-ui`;
    ctx.textAlign = 'center';
    ctx.fillStyle = typeof getStyleColor === 'function' ? getStyleColor(styleKey) : '#ffffff';

    let maxWidth = 0;
    for (const line of lines) {
      const width = ctx.measureText(line).width;
      if (width > maxWidth) maxWidth = width;
    }

    const padX = Math.round(ui.labelPad * 0.75);
    const padY = Math.max(2, Math.round(ui.labelPad * 0.1));
    const totalTextHeight = ui.labelH * lines.length;

    ctx.translate(x + ui.offsetX, y + ui.offsetY);
    ctx.fillStyle = `rgba(0, 0, 0, ${ui.bgAlpha})`;
    ctx.fillRect(
      -maxWidth / 2 - padX,
      -totalTextHeight / 2 - padY,
      maxWidth + padX * 2,
      totalTextHeight + padY * 2
    );

    ctx.fillStyle = typeof getStyleColor === 'function' ? getStyleColor(styleKey) : '#ffffff';
    let startY;
    if (lines.length === 1) {
      startY = ui.fontPx * 0.35;
    } else {
      startY = -((ui.labelH * lines.length) / 2) + ui.labelH / 2 + ui.fontPx * 0.35;
    }

    for (let i = 0; i < lines.length; ++i) {
      ctx.fillText(lines[i], 0, startY + i * ui.labelH);
    }

    ctx.restore();
  }

  function renderDescriptors(ctx, descriptors, dependencies) {
    if (!ctx || !Array.isArray(descriptors) || descriptors.length === 0) return;
    const {
      panelRect,
      ui,
      getPoiRecord,
      uvToScreen,
      isStyleVisible,
      getStyleColor,
      wrapLabelText,
      globalScale = 1,
    } = dependencies || {};

    if (!panelRect || typeof uvToScreen !== 'function' || typeof getPoiRecord !== 'function') {
      return;
    }

    ctx.save();
    const centerX = panelRect.x + panelRect.width / 2;
    const centerY = panelRect.y + panelRect.height / 2;
    ctx.translate(centerX, centerY);
    if (globalScale !== 1) {
      ctx.scale(globalScale, globalScale);
    }
    ctx.translate(-centerX, -centerY);

    for (const descriptor of descriptors) {
      if (!descriptor) continue;
      const { poiId, text, styleKey } = descriptor;
      if (!poiId || !text) continue;
      if (typeof isStyleVisible === 'function' && !isStyleVisible(styleKey)) continue;

      const record = getPoiRecord(poiId);
      if (!record || !Array.isArray(record.uv) || record.uv.length < 2) continue;
      const [u, v] = record.uv;
      const { x, y } = uvToScreen(panelRect, u, v);
      drawLabel(ctx, x, y, text, styleKey, ui, { getStyleColor, wrapLabelText });
    }

    ctx.restore();
  }

  runtime.renderer = {
    clearCanvas,
    renderDescriptors,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runtime.renderer;
  }
})();
