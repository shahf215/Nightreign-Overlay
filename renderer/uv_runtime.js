(function (global) {
  function dprSetupCanvas(canvas, ctx) {
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth, H = window.innerHeight;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return dpr;
  }

  const refPanel = { 
    x: 0.567871, 
    y: 0.150174, 
    width: 0.387695, 
    height: 0.676215 
  };

  const labelOffset = {
    x: 0.01500,
    yTop: 0.0405554,
    yBottom: 0.0407711,
  };

  function frame16x9(W, H) {
    const TARGET = 16 / 9, 
    a = W / H;
    if (a >= TARGET) {
      const height = H;
      const width = Math.round(height * TARGET);
      const x = Math.round((W - width) / 2);
      return { x, y: 0, width, height };
    } else {
      const width = W;
      const height = Math.round(width / TARGET);
      const y = Math.round((H - height) / 2);
      return { x: 0, y, width, height };
    }
  }

  function getSurfaceRect(W, H) {
    const near = (x, y) => Math.abs(x - y) < 0.02;
    return near(W / H, 16 / 9) ? { x: 0, y: 0, width: W, height: H } : frame16x9(W, H);
  }

  function getUIScale(surfaceRectPx) {
    if (!surfaceRectPx) {
      const W = window.innerWidth, H = window.innerHeight;
      surfaceRectPx = getSurfaceRect(W, H);
    }
    return surfaceRectPx.height / 1440;
  }
  function panelToPixels(panelNormRect, surfaceRectPx) {
    return {
      x: Math.round(surfaceRectPx.x + panelNormRect.x * surfaceRectPx.width),
      y: Math.round(surfaceRectPx.y + panelNormRect.y * surfaceRectPx.height),
      width: Math.round(panelNormRect.width * surfaceRectPx.width),
      height: Math.round(panelNormRect.height * surfaceRectPx.height)
    };
  }

  function uvToScreen(panelPxRect, u, v) {
    const baseX = panelPxRect.x + u * panelPxRect.width;
    const baseY = panelPxRect.y + v * panelPxRect.height;

    const xOffset = labelOffset.x * panelPxRect.width;
    const midY = panelPxRect.y + 0.5 * panelPxRect.height;
    const yOffsetNorm = (baseY < midY) ? labelOffset.yTop : labelOffset.yBottom;
    const yOffset = yOffsetNorm * panelPxRect.height;

    return { x: baseX + xOffset, y: baseY + yOffset };
  }

  function getPanelRect(surfaceRectPx) {
    if (!surfaceRectPx) {
      const W = window.innerWidth, H = window.innerHeight;
      surfaceRectPx = getSurfaceRect(W, H);
    }
    return panelToPixels(refPanel, surfaceRectPx);
  }

  function uvToSeedFinder(panelPxRect, u, v) {
    return [panelPxRect.x + u * panelPxRect.width, panelPxRect.y + v * panelPxRect.height];
  }

  global.getPanelRect = getPanelRect;
  global.dprSetupCanvas = dprSetupCanvas;
  global.uvToSeedFinder = uvToSeedFinder;
  global.getSurfaceRect = getSurfaceRect;
  global.getUIScale = getUIScale;
  global.uvToScreen = uvToScreen;
})(window);
