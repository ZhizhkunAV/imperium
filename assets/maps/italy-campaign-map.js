/**
 * Italy Campaign Map — только game_map.png + Canvas (без внешних масок/Leaflet)
 * V1: пиксельный анализ цвета → яркая заливка + зелёная обводка границы провинции
 * V2: GeoJSON Италия + 6 провинций (мягкие границы)
 * V3: та же карта game_map без клик-выделения (схема)
 */
window.ItalyCampaignMap = (function () {
  const GAME_MAP = '/images/map_variant1_provinces.png';
  const GAME_MAP_FALLBACK = '/images/game_map.png';
  const PARCHMENT_MAP = '/images/map_variant3_parchment.png';
  const RTW_MAP = '/images/map_variant1_rtw.png';

  const PROVINCES = {
    red: { id: 1, name: 'Красная', bright: [255, 130, 95] },
    blue: { id: 2, name: 'Синяя', bright: [70, 185, 255] },
    green: { id: 3, name: 'Зелёная', bright: [110, 230, 95] },
    yellow: { id: 4, name: 'Жёлтая', bright: [255, 225, 70] },
  };

  const CITIES = [
    { id: 'rome', name: 'Рим', lon: 12.4964, lat: 41.9028, fill: '#b8745c' },
    { id: 'venice', name: 'Венеция', lon: 12.3155, lat: 45.4408, fill: '#7a9a55' },
    { id: 'genoa', name: 'Генуя', lon: 8.9463, lat: 44.4056, fill: '#5a8aaa' },
    { id: 'milan', name: 'Милан', lon: 9.1900, lat: 45.4642, fill: '#9a7a4a' },
    { id: 'naples', name: 'Неаполь', lon: 14.2681, lat: 40.8518, fill: '#b89a55' },
    { id: 'palermo', name: 'Палермо', lon: 13.3615, lat: 38.1157, fill: '#a89060' },
  ];

  let state = null;

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // same-origin через Vite — без CORS; anonymous ломает file:// и иногда локальные пути
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Не удалось загрузить ' + src));
      img.src = src;
    });
  }

  /** Диапазоны цветов с учётом шума/сжатия PNG (RTW-провинции + пергаментные пастели) */
  function classifyProvinceColor(r, g, b, a) {
    if (a < 30) return null;
    const br = (r + g + b) / 3;

    // море / тёмная сетка / чёрный фон
    if (br < 42) return null;
    if (b > 70 && b > r + 20 && b > g + 10 && br < 145 && r < 120) return null;

    // чёрные контуры
    if (br < 70 && Math.abs(r - g) < 22 && Math.abs(g - b) < 22) return null;

    // горы (коричневые/серые скалы)
    if (r > 85 && g > 45 && b < 100 && r > b + 28 && g < r + 5 && br < 170) return null;

    // жёлтый / золотой / песочный
    if (r > 145 && g > 110 && b < 140 && (r + g) > b * 1.9) return 'yellow';
    if (r > 170 && g > 150 && b > 90 && b < 170 && Math.abs(r - g) < 40) return 'yellow';

    // красный / терракота / розово-красный (Cisalpina)
    if (r > 130 && r > g + 15 && r > b + 15 && g < 170) return 'red';
    if (r > 160 && g > 90 && g < 160 && b > 90 && b < 160 && r > g && r > b) return 'red';

    // синий / бирюзовый / серо-голубой
    if (b > 100 && g > 85 && b >= r + 5 && r < 170) return 'blue';
    if (b > 120 && Math.abs(g - b) < 40 && r < g) return 'blue';

    // зелёный / оливковый / мятный
    if (g > 100 && g >= r - 10 && g > b + 5 && b < 160) return 'green';
    if (g > 130 && r < 160 && b < 140 && g > r && g > b) return 'green';

    return null;
  }

  function openSidePanel(title, bodyHtml) {
    const panel = document.getElementById('mapSidePanel');
    if (!panel) return;
    const titleEl = document.getElementById('mapSidePanelTitle');
    const bodyEl = document.getElementById('mapSidePanelBody');
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = bodyHtml || '';
    panel.classList.add('open');
  }

  function closeSidePanel() {
    document.getElementById('mapSidePanel')?.classList.remove('open');
  }

  function createViewport(container) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:#061018;cursor:grab;';
    const stage = document.createElement('div');
    stage.style.cssText = 'position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform;';
    wrap.appendChild(stage);
    container.appendChild(wrap);

    const vp = {
      wrap, stage, scale: 1, tx: 0, ty: 0,
      dragging: false, moved: false, lastX: 0, lastY: 0,
      contentW: 800, contentH: 800,
    };

    const apply = () => {
      stage.style.transform = `translate(${vp.tx}px,${vp.ty}px) scale(${vp.scale})`;
    };

    vp.fit = () => {
      const cw = wrap.clientWidth || 800;
      const ch = wrap.clientHeight || 600;
      vp.scale = Math.min(cw / vp.contentW, ch / vp.contentH) * 0.96;
      vp.tx = (cw - vp.contentW * vp.scale) / 2;
      vp.ty = (ch - vp.contentH * vp.scale) / 2;
      apply();
    };

    vp.screenToLocal = (cx, cy) => {
      const rect = wrap.getBoundingClientRect();
      return {
        x: (cx - rect.left - vp.tx) / vp.scale,
        y: (cy - rect.top - vp.ty) / vp.scale,
      };
    };

    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const prev = vp.scale;
      vp.scale = Math.min(5, Math.max(0.3, vp.scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
      vp.tx = mx - (mx - vp.tx) * (vp.scale / prev);
      vp.ty = my - (my - vp.ty) * (vp.scale / prev);
      apply();
    }, { passive: false });

    wrap.addEventListener('mousedown', (e) => {
      if (e.button !== 0 && e.button !== 2) return;
      vp.dragging = true;
      vp.moved = false;
      vp.lastX = e.clientX;
      vp.lastY = e.clientY;
      wrap.style.cursor = 'grabbing';
    });

    const onMove = (e) => {
      if (!vp.dragging) return;
      const dx = e.clientX - vp.lastX;
      const dy = e.clientY - vp.lastY;
      if (Math.abs(dx) + Math.abs(dy) > 3) vp.moved = true;
      vp.tx += dx;
      vp.ty += dy;
      vp.lastX = e.clientX;
      vp.lastY = e.clientY;
      apply();
    };
    const onUp = () => {
      vp.dragging = false;
      wrap.style.cursor = 'grab';
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    wrap.addEventListener('contextmenu', (e) => e.preventDefault());

    vp.destroy = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    return vp;
  }

  // ========== VARIANT 1 / shared pixel map ==========
  async function mountV1(container, interactive, imageUrl, nameOverrides) {
    const vp = createViewport(container);

    const names = {
      red: (nameOverrides && nameOverrides.red) || 'Красная',
      blue: (nameOverrides && nameOverrides.blue) || 'Синяя',
      green: (nameOverrides && nameOverrides.green) || 'Зелёная',
      yellow: (nameOverrides && nameOverrides.yellow) || 'Жёлтая',
    };

    let img;
    const primary = imageUrl || GAME_MAP;
    try {
      img = await loadImage(primary);
    } catch (_) {
      try {
        img = await loadImage(GAME_MAP_FALLBACK);
      } catch (e) {
        container.innerHTML = '<div style="color:#c9a84c;padding:24px;font-family:Cinzel,serif;">Не удалось загрузить карту</div>';
        return () => { container.innerHTML = ''; };
      }
    }

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    vp.contentW = w;
    vp.contentH = h;
    vp.stage.style.width = w + 'px';
    vp.stage.style.height = h + 'px';

    // base layer
    const base = document.createElement('canvas');
    base.width = w;
    base.height = h;
    base.style.cssText = `display:block;width:${w}px;height:${h}px;`;
    const bctx = base.getContext('2d', { willReadFrequently: true });
    bctx.drawImage(img, 0, 0);

    // selection overlay
    const overlay = document.createElement('canvas');
    overlay.width = w;
    overlay.height = h;
    overlay.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px;pointer-events:none;`;
    const octx = overlay.getContext('2d');

    vp.stage.appendChild(base);
    vp.stage.appendChild(overlay);

    // Read once
    let imageData;
    try {
      imageData = bctx.getImageData(0, 0, w, h);
    } catch (err) {
      container.innerHTML = '<div style="color:#ff8888;padding:24px;">CORS: не удалось прочитать пиксели. Добавьте crossOrigin или откройте через локальный сервер.</div>';
      return () => { container.innerHTML = ''; };
    }
    const pixels = imageData.data;

    // Precompute province id map for speed
    const idMap = new Uint8Array(w * h);
    const keyToId = { red: 1, blue: 2, green: 3, yellow: 4 };
    for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
      const key = classifyProvinceColor(pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]);
      if (key) idMap[p] = keyToId[key];
    }

    // Fill small holes (лес/реки внутри провинции)
    const filled = new Uint8Array(idMap);
    for (let y = 2; y < h - 2; y++) {
      for (let x = 2; x < w - 2; x++) {
        const idx = y * w + x;
        if (idMap[idx]) continue;
        const counts = [0, 0, 0, 0, 0];
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            counts[idMap[(y + dy) * w + (x + dx)]]++;
          }
        }
        let best = 0; let bestC = 0;
        for (let c = 1; c <= 4; c++) {
          if (counts[c] > bestC) { bestC = counts[c]; best = c; }
        }
        if (bestC >= 12) filled[idx] = best;
      }
    }

    function getProvinceAt(lx, ly) {
      const x = Math.max(0, Math.min(w - 1, Math.floor(lx)));
      const y = Math.max(0, Math.min(h - 1, Math.floor(ly)));

      // 1×1 sample (как в ТЗ)
      const sample = bctx.getImageData(x, y, 1, 1).data;
      let key = classifyProvinceColor(sample[0], sample[1], sample[2], sample[3]);
      let id = key ? keyToId[key] : filled[y * w + x];

      if (!id) {
        const counts = [0, 0, 0, 0, 0];
        for (let dy = -12; dy <= 12; dy++) {
          for (let dx = -12; dx <= 12; dx++) {
            const nx = x + dx; const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            counts[filled[ny * w + nx]]++;
          }
        }
        let best = 0; let bestC = 0;
        for (let c = 1; c <= 4; c++) {
          if (counts[c] > bestC) { bestC = counts[c]; best = c; }
        }
        id = best;
      }
      if (!id) return null;
      const provKey = Object.keys(keyToId).find((k) => keyToId[k] === id);
      return { id, name: names[provKey] || 'Провинция', key: provKey };
    }

    /**
     * Обводка выбранной провинции чёрной границей (только край, без заливки внутри).
     */
    function drawProvinceHighlight(prov) {
      octx.clearRect(0, 0, w, h);
      const out = octx.createImageData(w, h);
      const d = out.data;
      const pid = prov.id;
      const thickness = 3; // толщина чёрной рамки в пикселях

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          if (filled[idx] !== pid) continue;

          let isEdge = false;
          for (let dy = -1; dy <= 1 && !isEdge; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              if (filled[(y + dy) * w + (x + dx)] !== pid) {
                isEdge = true;
                break;
              }
            }
          }
          if (!isEdge) continue;

          // рисуем толстую чёрную границу вокруг края
          for (let ty = -thickness; ty <= thickness; ty++) {
            for (let tx = -thickness; tx <= thickness; tx++) {
              if (tx * tx + ty * ty > thickness * thickness) continue;
              const nx = x + tx;
              const ny = y + ty;
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
              const o = (ny * w + nx) * 4;
              d[o] = 0;
              d[o + 1] = 0;
              d[o + 2] = 0;
              d[o + 3] = 255;
            }
          }
        }
      }
      octx.putImageData(out, 0, 0);
    }

    function selectAt(e) {
      if (!interactive) return;
      const p = vp.screenToLocal(e.clientX, e.clientY);
      const prov = getProvinceAt(p.x, p.y);
      if (!prov) return;
      drawProvinceHighlight(prov);
      openSidePanel(
        `Вы выбрали провинцию: ${prov.name}`,
        `<p>Провинция определена по цвету заливки.</p>
         <p>Чёрная граница обводит выбранную область.</p>`
      );
    }

    if (interactive) {
      vp.wrap.addEventListener('click', (e) => { if (!vp.moved) selectAt(e); });
      vp.wrap.addEventListener('contextmenu', (e) => { e.preventDefault(); selectAt(e); });
    }

    vp.fit();
    return () => {
      vp.destroy();
      container.innerHTML = '';
      closeSidePanel();
    };
  }

  // ========== VARIANT 2 ==========
  async function mountV2(container) {
    const vp = createViewport(container);
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    vp.stage.appendChild(canvas);

    let world;
    try {
      const resp = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
      if (!resp.ok) throw new Error('fetch');
      world = await resp.json();
    } catch (_) {
      // fallback: показать game_map без ошибки "файл не найден"
      return mountV1(container, true);
    }

    const italyFeatures = world.features.filter((f) => {
      const n = String(f.properties?.name || f.properties?.NAME || f.properties?.ADMIN || '').toLowerCase();
      return n === 'italy' || n === 'italia';
    });
    if (!italyFeatures.length || !window.d3) {
      return mountV1(container, true);
    }

    const italy = { type: 'FeatureCollection', features: italyFeatures };
    const W = 1000;
    const H = 1280;
    canvas.width = W;
    canvas.height = H;
    vp.contentW = W;
    vp.contentH = H;
    vp.stage.style.width = W + 'px';
    vp.stage.style.height = H + 'px';
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const d3 = window.d3;
    const projection = d3.geoMercator().fitExtent([[36, 28], [W - 36, H - 28]], italy);
    const path = d3.geoPath(projection);
    const ctx = canvas.getContext('2d');

    const cityXY = CITIES.map((c) => {
      const xy = projection([c.lon, c.lat]);
      return { ...c, x: xy[0], y: xy[1] };
    });

    // raster ownership
    ctx.fillStyle = '#0a1218';
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    path.context(ctx);
    italyFeatures.forEach((f) => path(f));
    ctx.fillStyle = '#c8c4bc';
    ctx.fill();

    const land = ctx.getImageData(0, 0, W, H).data;
    const isLand = new Uint8Array(W * H);
    for (let i = 0, p = 0; i < land.length; i += 4, p++) {
      if (land[i] > 150) isLand[p] = 1;
    }

    const owner = new Int8Array(W * H);
    owner.fill(-1);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        if (!isLand[idx]) continue;
        let best = 0; let bestD = Infinity;
        for (let i = 0; i < cityXY.length; i++) {
          const dx = x - cityXY[i].x;
          const dy = y - cityXY[i].y;
          const d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = i; }
        }
        owner[idx] = best;
      }
    }

    function drawSelectedBlackBorder(selected) {
      if (selected < 0) return;
      const thickness = 3;
      const imgData = ctx.getImageData(0, 0, W, H);
      const d = imgData.data;
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const idx = y * W + x;
          if (owner[idx] !== selected) continue;
          const isEdge =
            owner[idx - 1] !== selected || owner[idx + 1] !== selected ||
            owner[idx - W] !== selected || owner[idx + W] !== selected;
          if (!isEdge) continue;
          for (let ty = -thickness; ty <= thickness; ty++) {
            for (let tx = -thickness; tx <= thickness; tx++) {
              if (tx * tx + ty * ty > thickness * thickness) continue;
              const nx = x + tx;
              const ny = y + ty;
              if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
              const o = (ny * W + nx) * 4;
              d[o] = 0;
              d[o + 1] = 0;
              d[o + 2] = 0;
              d[o + 3] = 255;
            }
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    function redraw(selected) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, W, H);

      // сплошная Италия
      ctx.beginPath();
      path.context(ctx);
      italyFeatures.forEach((f) => path(f));
      ctx.fillStyle = '#c9c5bd';
      ctx.fill();

      // заливка провинций (без подсветки заливкой при выборе)
      const imgData = ctx.getImageData(0, 0, W, H);
      const d = imgData.data;
      for (let i = 0; i < owner.length; i++) {
        const oi = owner[i];
        if (oi < 0) continue;
        const o = i * 4;
        const hex = cityXY[oi].fill;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        d[o] = Math.round(d[o] * 0.4 + r * 0.6);
        d[o + 1] = Math.round(d[o + 1] * 0.4 + g * 0.6);
        d[o + 2] = Math.round(d[o + 2] * 0.4 + b * 0.6);
        d[o + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      // берег
      ctx.beginPath();
      path.context(ctx);
      italyFeatures.forEach((f) => path(f));
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // чёрная граница выбранной провинции
      drawSelectedBlackBorder(selected);

      cityXY.forEach((c) => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.font = 'bold 13px Cinzel, Georgia, serif';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#fff';
        ctx.strokeText(c.name, c.x + 8, c.y + 4);
        ctx.fillText(c.name, c.x + 8, c.y + 4);
      });
    }

    let selected = -1;
    redraw(selected);

    function selectAt(e) {
      const p = vp.screenToLocal(e.clientX, e.clientY);
      const x = Math.max(0, Math.min(W - 1, Math.floor(p.x)));
      const y = Math.max(0, Math.min(H - 1, Math.floor(p.y)));
      const oi = owner[y * W + x];
      if (oi < 0) return;
      selected = oi;
      redraw(selected);
      openSidePanel(
        `Вы выбрали провинцию: ${cityXY[oi].name}`,
        `<p>Столица: <b>${cityXY[oi].name}</b></p>`
      );
    }

    vp.wrap.addEventListener('click', (e) => { if (!vp.moved) selectAt(e); });
    vp.wrap.addEventListener('contextmenu', (e) => { e.preventDefault(); selectAt(e); });
    vp.fit();

    return () => {
      vp.destroy();
      container.innerHTML = '';
      closeSidePanel();
    };
  }

  async function mount(container, variant) {
    destroy();
    if (!container) return;
    container.innerHTML = '';
    const v = Number(variant) || 1;
    let unmount;
    if (v === 2) {
      unmount = await mountV2(container);
    } else if (v === 3) {
      unmount = await mountV1(container, true, PARCHMENT_MAP, {
        red: 'Cisalpina',
        green: 'Зелёная провинция',
        blue: 'Синяя провинция',
        yellow: 'Italia',
      });
    } else {
      unmount = await mountV1(container, true, GAME_MAP, null);
    }
    state = { unmount, variant: v };
  }

  function destroy() {
    if (state && typeof state.unmount === 'function') state.unmount();
    state = null;
  }

  return { mount, destroy, closeSidePanel };
})();
