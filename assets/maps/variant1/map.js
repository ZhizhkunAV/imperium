/**
 * Вариант 1 — выделение провинций по цветовой заливке game_map.png
 * Клик по красной/зелёной/синей/жёлтой области выделяет всю эту заливку.
 */
window.MapVariant1 = (function () {
  const IMAGE_URL = '/images/game_map.png';

  const PROVINCES = {
    red: {
      id: 'prov_northwest',
      entity: 'province_northwest',
      name: 'Северо-Запад',
    },
    green: {
      id: 'prov_northeast',
      entity: 'province_northeast',
      name: 'Северо-Восток',
    },
    blue: {
      id: 'prov_central',
      entity: 'province_central',
      name: 'Центр',
    },
    yellow: {
      id: 'prov_south',
      entity: 'province_south',
      name: 'Юг и острова',
    },
  };

  let destroyFn = null;

  function openProvinceDetail(entityId) {
    const url = `./pageOfDetailAboutUnitAndBuild.html?entity=${encodeURIComponent(entityId)}`;
    if (window.openSecondaryModal) {
      window.openSecondaryModal(url, { position: 'left' });
    }
  }

  function classifyPixel(r, g, b, a) {
    if (a < 40) return null;

    const brightness = (r + g + b) / 3;
    // sea / dark grid
    if (brightness < 48) return null;
    if (b > 70 && b > r + 30 && b > g + 20 && brightness < 130) return null;

    // black coast / province borders
    if (brightness < 65 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) return null;

    // mountains (brown peaks)
    if (r > 85 && g > 55 && b < 90 && r > b + 35 && g < r && r - g < 80 && brightness < 160) {
      return null;
    }

    // yellow / gold fill
    if (r > 145 && g > 115 && b < 120 && (r + g) > b * 2.2 && Math.abs(r - g) < 90) return 'yellow';

    // red / terracotta fill
    if (r > 120 && r > g + 28 && r > b + 35 && g < 150 && b < 130) return 'red';

    // blue / teal fill
    if (b > 95 && g > 80 && b >= r + 15 && g >= r - 5 && r < 150) return 'blue';

    // green / olive fill
    if (g > 105 && g >= r - 5 && g > b + 12 && r < 170 && b < 140) return 'green';

    return null;
  }

  function buildMasks(img) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const src = document.createElement('canvas');
    src.width = w;
    src.height = h;
    const sctx = src.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(img, 0, 0);
    const { data } = sctx.getImageData(0, 0, w, h);

    const masks = {
      red: new Uint8Array(w * h),
      green: new Uint8Array(w * h),
      blue: new Uint8Array(w * h),
      yellow: new Uint8Array(w * h),
    };

    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const key = classifyPixel(data[i], data[i + 1], data[i + 2], data[i + 3]);
      if (key) masks[key][p] = 1;
    }

    // Fill small holes (forests/rivers inside province) by majority of 3x3 neighbors
    const filled = {};
    Object.keys(masks).forEach((key) => {
      const srcMask = masks[key];
      const out = new Uint8Array(srcMask);
      for (let y = 2; y < h - 2; y++) {
        for (let x = 2; x < w - 2; x++) {
          const idx = y * w + x;
          if (srcMask[idx]) continue;
          let count = 0;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              if (srcMask[(y + dy) * w + (x + dx)]) count++;
            }
          }
          if (count >= 12) out[idx] = 1;
        }
      }
      filled[key] = out;
    });

    return { w, h, masks: filled, sourceData: data };
  }

  function drawHighlight(ctx, mask, w, h) {
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (!mask[idx]) continue;
        const o = idx * 4;
        const edge =
          !mask[idx - 1] || !mask[idx + 1] ||
          !mask[idx - w] || !mask[idx + w];
        if (edge) {
          d[o] = 80;
          d[o + 1] = 255;
          d[o + 2] = 140;
          d[o + 3] = 230;
        } else {
          d[o] = 46;
          d[o + 1] = 204;
          d[o + 2] = 113;
          d[o + 3] = 72;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function pickProvinceAt(x, y, w, h, masks, sourceData) {
    x = Math.max(0, Math.min(w - 1, Math.floor(x)));
    y = Math.max(0, Math.min(h - 1, Math.floor(y)));
    const idx = y * w + x;

    // direct mask hit
    for (const key of ['red', 'green', 'blue', 'yellow']) {
      if (masks[key][idx]) return key;
    }

    // nearby search (icons / borders)
    const radius = 8;
    const counts = { red: 0, green: 0, blue: 0, yellow: 0 };
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const nidx = ny * w + nx;
        for (const key of Object.keys(counts)) {
          if (masks[key][nidx]) counts[key]++;
        }
      }
    }
    let best = null;
    let bestCount = 0;
    Object.keys(counts).forEach((key) => {
      if (counts[key] > bestCount) {
        bestCount = counts[key];
        best = key;
      }
    });
    if (best) return best;

    // fallback: classify raw pixel
    const o = idx * 4;
    return classifyPixel(sourceData[o], sourceData[o + 1], sourceData[o + 2], sourceData[o + 3]);
  }

  function mount(container) {
    if (!container) return () => {};
    if (destroyFn) destroyFn();
    container.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'map-v1-wrap';
    wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:#061018;cursor:grab;';

    const stage = document.createElement('div');
    stage.className = 'map-v1-stage';
    stage.style.cssText = 'position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform;';

    const img = document.createElement('img');
    img.src = IMAGE_URL;
    img.alt = 'Карта кампании';
    img.draggable = false;
    img.style.cssText = 'display:block;max-width:none;user-select:none;pointer-events:none;';

    const overlay = document.createElement('canvas');
    overlay.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;';

    stage.appendChild(img);
    stage.appendChild(overlay);
    wrap.appendChild(stage);
    container.appendChild(wrap);

    let scale = 1;
    let tx = 0;
    let ty = 0;
    let dragging = false;
    let moved = false;
    let lastX = 0;
    let lastY = 0;
    let selectedKey = null;
    let maskData = null;
    const octx = overlay.getContext('2d');

    function applyTransform() {
      stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    }

    function selectKey(key) {
      selectedKey = key;
      if (!maskData || !key) {
        octx.clearRect(0, 0, overlay.width, overlay.height);
        return;
      }
      drawHighlight(octx, maskData.masks[key], maskData.w, maskData.h);
    }

    function stagePointFromEvent(e) {
      const rect = wrap.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      return {
        x: (mx - tx) / scale,
        y: (my - ty) / scale,
      };
    }

    function onImageReady() {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      img.width = w;
      img.height = h;
      stage.style.width = `${w}px`;
      stage.style.height = `${h}px`;
      overlay.width = w;
      overlay.height = h;
      overlay.style.width = `${w}px`;
      overlay.style.height = `${h}px`;

      maskData = buildMasks(img);

      const cw = wrap.clientWidth;
      const ch = wrap.clientHeight;
      scale = Math.min(cw / w, ch / h) * 0.96;
      tx = (cw - w * scale) / 2;
      ty = (ch - h * scale) / 2;
      applyTransform();
    }

    img.onload = onImageReady;
    if (img.complete && img.naturalWidth) onImageReady();

    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const prev = scale;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      scale = Math.min(5, Math.max(0.3, scale * factor));
      tx = mx - (mx - tx) * (scale / prev);
      ty = my - (my - ty) * (scale / prev);
      applyTransform();
      if (selectedKey) selectKey(selectedKey);
    }, { passive: false });

    wrap.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      lastX = e.clientX;
      lastY = e.clientY;
      wrap.style.cursor = 'grabbing';
    });

    function onMove(e) {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      tx += dx;
      ty += dy;
      lastX = e.clientX;
      lastY = e.clientY;
      applyTransform();
    }

    function onUp() {
      dragging = false;
      wrap.style.cursor = 'grab';
    }

    wrap.addEventListener('click', (e) => {
      if (moved || !maskData) return;
      const p = stagePointFromEvent(e);
      const key = pickProvinceAt(p.x, p.y, maskData.w, maskData.h, maskData.masks, maskData.sourceData);
      if (!key) return;
      selectKey(key);
    });

    wrap.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!maskData) return;
      const p = stagePointFromEvent(e);
      const key = pickProvinceAt(p.x, p.y, maskData.w, maskData.h, maskData.masks, maskData.sourceData);
      if (!key) return;
      selectKey(key);
      openProvinceDetail(PROVINCES[key].entity);
    });

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    destroyFn = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      container.innerHTML = '';
      destroyFn = null;
    };

    return destroyFn;
  }

  return { mount, PROVINCES };
})();
