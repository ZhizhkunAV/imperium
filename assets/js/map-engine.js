/**
 * Общий движок карты кампании: камера, отрисовка RTW, дороги, армии, туман.
 */
(function (global) {
  'use strict';

  var CAMERA_MODES = [
    { id: 'rtw', label: 'Угол: Total War', a: 1, b: 0.05, c: -0.16, d: 0.88, lift: 0, fitY: 0.48, rotateX: 60, rotateZ: -8 }
  ];

  var BORDER_CYAN = {
    glow: 'rgba(50, 160, 220, 0.28)',
    mid: 'rgba(80, 195, 255, 0.7)',
    core: 'rgba(170, 235, 255, 0.95)',
    pick: 'rgba(200, 245, 255, 1)'
  };

  var BUILDING_ICONS = {
    walls: '🏛️',
    barracks: '⚔️',
    temple: '⛩️',
    forum: '🏺',
    aqueduct: '🌊',
    farm: '🌾',
    roads: '🛤️'
  };

  function cameraPreset(modeIndex) {
    return CAMERA_MODES[modeIndex] || CAMERA_MODES[0];
  }

  function applyCssTransform(stage, cam, tx, ty, scale, canvasH, tiltExtra, yawExtra) {
    var liftPx = Math.round(canvasH * (cam.lift || 0));
    var rx = Math.max(0, Math.min(75, (cam.rotateX || 0) + (tiltExtra || 0)));
    var rz = (cam.rotateZ || 0) + (yawExtra || 0);
    stage.style.transform =
      'translate3d(' + tx + 'px,' + ty + 'px,0) scale(' + scale + ') ' +
      'rotateX(' + rx + 'deg) rotateZ(' + rz + 'deg) ' +
      'matrix(' + cam.a + ',' + cam.b + ',' + cam.c + ',' + cam.d + ',0,' + liftPx + ')';
  }

  function clampPan(opts) {
    var vw = opts.vw;
    var vh = opts.vh;
    var scale = Math.max(opts.minScale, Math.min(opts.maxScale, opts.scale));
    var cam = opts.cam;
    var sw = opts.mapW * scale;
    var sh = opts.mapH * scale * cam.d;
    var maxX = Math.max(0, (sw - vw) / 2);
    var maxY = Math.max(0, (sh - vh) / 2 + Math.abs(opts.mapH * cam.lift * scale * 0.5));
    return {
      scale: scale,
      tx: Math.max(-maxX, Math.min(maxX, opts.tx)),
      ty: Math.max(-maxY, Math.min(maxY, opts.ty))
    };
  }

  function screenToMap(sx, sy, opts) {
    var vx = sx - opts.vw / 2;
    var vy = sy - opts.vh / 2;
    var liftPx = opts.mapH * opts.cam.lift * opts.scale;
    var px = vx - opts.tx;
    var py = vy - opts.ty - liftPx;
    var s = opts.scale || 1;
    var cxp = px / s;
    var cyp = py / s;
    var cam = opts.cam;
    var det = cam.a * cam.d - cam.b * cam.c || 1;
    var cx = (cam.d * cxp - cam.c * cyp) / det;
    var cy = (-cam.b * cxp + cam.a * cyp) / det;
    return { x: cx + opts.mapW / 2, y: cy + opts.mapH / 2 };
  }

  function strokeCyanGlow(ctx, lineWidth) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = BORDER_CYAN.glow;
    ctx.lineWidth = lineWidth * 3.4;
    ctx.stroke();
    ctx.strokeStyle = BORDER_CYAN.mid;
    ctx.lineWidth = lineWidth * 1.7;
    ctx.stroke();
    ctx.strokeStyle = BORDER_CYAN.core;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();
  }

  function strokeWindingRoad(ctx, a, b, seed) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var dist = Math.hypot(dx, dy) || 1;
    var nx = -dy / dist;
    var ny = dx / dist;
    var n = Math.max(4, Math.round(dist / 42));
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    for (var i = 1; i < n; i++) {
      var t = i / n;
      var bend = Math.sin(t * Math.PI * 2.4 + seed) * Math.min(22, dist * 0.09)
        + Math.sin(t * Math.PI * 5.1 + seed * 1.7) * Math.min(9, dist * 0.035);
      ctx.lineTo(a.x + dx * t + nx * bend, a.y + dy * t + ny * bend);
    }
    ctx.lineTo(b.x, b.y);
  }

  function drawRoadNetwork(ctx, roads, seedBase) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (var i = 0; i < roads.length; i++) {
      var r = roads[i];
      strokeWindingRoad(ctx, r.a, r.b, (seedBase || 0) + i * 1.37);
      ctx.strokeStyle = 'rgba(70, 58, 40, 0.28)';
      ctx.lineWidth = 2.1;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(150, 130, 95, 0.18)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRtwCity(ctx, x, y, city, opts) {
    opts = opts || {};
    var u = opts.iconScale || 26;
    var s = (city.capital ? 1.2 : 1) * (u / 26);
    var factionColor = opts.bannerColor || '#6a3d8a';
    var selected = !!opts.selected;
    var showLabel = opts.showLabel !== false;

    ctx.save();
    ctx.translate(x, y);

    if (opts.influence && opts.influence > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, opts.influence, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(90, 200, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    if (city.buildings && city.buildings.length) {
      for (var bi = 0; bi < Math.min(city.buildings.length, 4); bi++) {
        var bx = -16 + bi * 9;
        ctx.font = (8 * s) + 'px serif';
        ctx.fillText(BUILDING_ICONS[city.buildings[bi]] || '🏠', bx, -14 * s);
      }
    }

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(2 * s, 5 * s, 12 * s, 4.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e8dcc4';
    ctx.fillRect(-9 * s, -6 * s, 8 * s, 8 * s);
    ctx.fillStyle = '#d4c4a4';
    ctx.fillRect(0, -4 * s, 9 * s, 7 * s);
    ctx.fillStyle = '#8b3a28';
    ctx.beginPath();
    ctx.moveTo(-10 * s, -6 * s);
    ctx.lineTo(-5 * s, -12 * s);
    ctx.lineTo(0, -6 * s);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-1 * s, -4 * s);
    ctx.lineTo(4.5 * s, -10 * s);
    ctx.lineTo(10 * s, -4 * s);
    ctx.fill();

    var bh = (city.capital ? 22 : 16) * s;
    ctx.fillStyle = selected ? '#c9a84c' : factionColor;
    ctx.fillRect(11 * s, -bh, 4 * s, bh);
    ctx.strokeStyle = 'rgba(255, 230, 160, 0.75)';
    ctx.lineWidth = Math.max(0.6, 0.8 * s);
    ctx.strokeRect(11 * s, -bh, 4 * s, bh);

    if (showLabel) {
      var label = ((city.ru || city.name) + '').toUpperCase();
      ctx.font = (city.capital ? 'bold ' : '') + Math.max(9, 10 * s) + "px 'Cinzel', Georgia, serif";
      ctx.textAlign = 'center';
      var tw = Math.max(ctx.measureText(label).width + 10 * s, 36 * s);
      var ly = 14 * s;
      ctx.fillStyle = selected ? 'rgba(90, 55, 20, 0.92)' : 'rgba(28, 18, 12, 0.88)';
      ctx.fillRect(-tw / 2, ly - 11 * s, tw, 14 * s);
      ctx.strokeStyle = selected ? '#e0c878' : 'rgba(201, 168, 76, 0.65)';
      ctx.strokeRect(-tw / 2, ly - 11 * s, tw, 14 * s);
      ctx.fillStyle = '#f4ead2';
      ctx.fillText(label, 0, ly);
    }
    ctx.restore();
  }

  function drawArmyStack(ctx, army, opts) {
    opts = opts || {};
    var inv = 1 / Math.max(0.7, opts.zoom || 1);
    var color = army.color || '#cc3333';
    var x = army.x;
    var y = army.y;
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(x + 10 * inv, y - 28 * inv, 5 * inv, 24 * inv);
    ctx.strokeStyle = '#f0e0b0';
    ctx.lineWidth = 1 * inv;
    ctx.strokeRect(x + 10 * inv, y - 28 * inv, 5 * inv, 24 * inv);
    var n = Math.min(8, army.strength || 8);
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      var px = x + Math.cos(ang) * 14 * inv;
      var py = y + Math.sin(ang) * 14 * inv;
      ctx.beginPath();
      ctx.arc(px, py, 4 * inv, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 0.8 * inv;
      ctx.stroke();
    }
    ctx.font = (9 * inv) + "px 'Cinzel', serif";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2 * inv;
    ctx.strokeText(String(army.strength || 0), x, y + 22 * inv);
    ctx.fillText(String(army.strength || 0), x, y + 22 * inv);
    ctx.restore();
  }

  function drawFogOverlay(ctx, w, h, holes) {
    ctx.save();
    ctx.fillStyle = 'rgba(8, 18, 28, 0.38)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < holes.length; i++) {
      var hole = holes[i];
      var r = hole.r || 120;
      var g = ctx.createRadialGradient(hole.x, hole.y, r * 0.15, hole.x, hole.y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.65, 'rgba(0,0,0,0.55)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Туман только на неразведанных пикселях провинций (карта под ним остаётся видимой). */
  function drawProvinceShroud(ctx, labelData, pixelRegions, cover, isExploredFn) {
    if (!labelData) return;
    var exploredKey = '';
    if (pixelRegions) {
      for (var ri = 0; ri < pixelRegions.length; ri++) {
        exploredKey += pixelRegions[ri].id + (isExploredFn(pixelRegions[ri].id) ? '1' : '0');
      }
    }
    if (!drawProvinceShroud._cache || drawProvinceShroud._key !== exploredKey) {
      var lw = labelData.width;
      var lh = labelData.height;
      var src = labelData.data;
      var off = document.createElement('canvas');
      off.width = lw;
      off.height = lh;
      var g = off.getContext('2d');
      var img = g.createImageData(lw, lh);
      var dst = img.data;
      var cmap = {};
      (pixelRegions || []).forEach(function (r) {
        cmap[(r.index != null ? r.index : 0) + 1] = r;
      });
      for (var y = 0; y < lh; y += 2) {
        for (var x = 0; x < lw; x += 2) {
          var i = (y * lw + x) * 4;
          var code = src[i];
          if (!code) continue;
          var reg = cmap[code];
          if (!reg || isExploredFn(reg.id)) continue;
          for (var oy = 0; oy < 2; oy++) {
            for (var ox = 0; ox < 2; ox++) {
              var j = ((y + oy) * lw + (x + ox)) * 4;
              dst[j] = 18; dst[j + 1] = 32; dst[j + 2] = 48; dst[j + 3] = 70;
            }
          }
        }
      }
      g.putImageData(img, 0, 0);
      drawProvinceShroud._cache = off;
      drawProvinceShroud._key = exploredKey;
    }
    ctx.drawImage(drawProvinceShroud._cache, cover.dx, cover.dy, cover.dw, cover.dh);
  }

  function drawMapEvent(ctx, ev) {
    ctx.save();
    ctx.translate(ev.x, ev.y);
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = ev.type === 'rebellion' ? 'rgba(200,60,40,0.9)' : 'rgba(200,160,40,0.9)';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "14px serif";
    ctx.textAlign = 'center';
    ctx.fillText(ev.type === 'rebellion' ? '⚔' : '⚠', 0, 5);
    ctx.restore();
  }

  function drawSupplyLine(ctx, from, to) {
    ctx.save();
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = 'rgba(90, 200, 255, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  var minimapLandCache = { key: '', canvas: null };
  var minimapProvinceCache = { key: '', canvas: null };

  function minimapFactionRGBA(factionId) {
    var id = factionId || 'rebels';
    if (id === 'spqr' || id === 'julii' || id === 'brutii' || id === 'scipii' || id === 'rome') {
      return [198, 42, 36, 155];
    }
    if (id === 'carthage') return [245, 240, 232, 165];
    if (id === 'greek') return [186, 154, 72, 120];
    if (id === 'gaul') return [70, 120, 60, 110];
    return [130, 118, 95, 100];
  }

  function ensureMinimapProvinces(opts, layout, landCanvas) {
    var seeds = opts.provinceSeeds;
    if (!seeds || !seeds.length || !landCanvas) return null;
    var sig = seeds.map(function (s) { return s.id + ':' + s.faction; }).join('|');
    var key = layout.mw + 'x' + layout.mh + ':' + layout.bbox.join(',') + ':' + sig;
    if (minimapProvinceCache.key === key && minimapProvinceCache.canvas) return minimapProvinceCache.canvas;

    var w = layout.mw;
    var h = layout.mh;
    var landCtx = landCanvas.getContext('2d');
    var landImg = landCtx.getImageData(0, 0, w, h);
    var ld = landImg.data;
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var g = c.getContext('2d');
    var out = g.createImageData(w, h);
    var od = out.data;
    var owners = new Int16Array(w * h);
    var i, x, y, lon, lat, best, bestD, s, dlon, dlat, d, idx, rgba, li;

    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        idx = y * w + x;
        li = idx * 4;
        // суша: зелёный канал заметно выше синего (море тёмно-синее)
        if (!(ld[li + 1] > ld[li + 2] + 12 && ld[li + 1] > 60)) {
          owners[idx] = -1;
          continue;
        }
        lon = layout.bbox[0] + (x - layout.ox) / layout.s;
        lat = layout.bbox[3] - (y - layout.oy) / layout.s;
        best = -1;
        bestD = 1e12;
        for (s = 0; s < seeds.length; s++) {
          if (seeds[s].hidden) continue;
          dlon = (lon - seeds[s].lon) * 0.72;
          dlat = lat - seeds[s].lat;
          d = dlon * dlon + dlat * dlat;
          if (d < bestD) { bestD = d; best = s; }
        }
        owners[idx] = best;
        if (best < 0) continue;
        rgba = minimapFactionRGBA(seeds[best].faction);
        od[li] = rgba[0];
        od[li + 1] = rgba[1];
        od[li + 2] = rgba[2];
        od[li + 3] = rgba[3];
      }
    }

    // тонкие границы провинций
    for (y = 1; y < h - 1; y++) {
      for (x = 1; x < w - 1; x++) {
        idx = y * w + x;
        if (owners[idx] < 0) continue;
        if (owners[idx] !== owners[idx - 1] || owners[idx] !== owners[idx + 1]
          || owners[idx] !== owners[idx - w] || owners[idx] !== owners[idx + w]) {
          li = idx * 4;
          od[li] = Math.min(255, od[li] + 40);
          od[li + 1] = Math.min(255, od[li + 1] + 30);
          od[li + 2] = Math.min(255, od[li + 2] + 20);
          od[li + 3] = Math.min(220, od[li + 3] + 50);
        }
      }
    }

    g.putImageData(out, 0, 0);
    minimapProvinceCache = { key: key, canvas: c };
    return c;
  }

  function minimapLayout(opts) {
    var mw = opts.width;
    var mh = opts.height;
    var bbox = opts.bbox || [6.6, 36.4, 18.6, 47.15];
    var pad = opts.pad != null ? opts.pad : 7;
    var geoW = Math.max(1e-6, bbox[2] - bbox[0]);
    var geoH = Math.max(1e-6, bbox[3] - bbox[1]);
    var s = Math.min((mw - pad * 2) / geoW, (mh - pad * 2) / geoH);
    var ox = (mw - geoW * s) / 2;
    var oy = (mh - geoH * s) / 2;
    return { mw: mw, mh: mh, bbox: bbox, s: s, ox: ox, oy: oy };
  }

  function minimapProject(layout, lon, lat) {
    return {
      x: layout.ox + (lon - layout.bbox[0]) * layout.s,
      y: layout.oy + (layout.bbox[3] - lat) * layout.s
    };
  }

  function minimapToLonLat(px, py, opts) {
    var layout = minimapLayout(opts);
    return {
      lon: layout.bbox[0] + (px - layout.ox) / layout.s,
      lat: layout.bbox[3] - (py - layout.oy) / layout.s
    };
  }

  function forEachGeoRing(geojson, fn) {
    if (!geojson) return;
    var features = geojson.features || (geojson.geometry ? [geojson] : []);
    for (var i = 0; i < features.length; i++) {
      var g = features[i] && features[i].geometry;
      if (!g) continue;
      var polys = g.type === 'Polygon' ? [g.coordinates]
        : g.type === 'MultiPolygon' ? g.coordinates
        : null;
      if (!polys) continue;
      for (var p = 0; p < polys.length; p++) {
        var ring = polys[p] && polys[p][0];
        if (ring && ring.length >= 3) fn(ring, features[i]);
      }
    }
  }

  function traceGeoRing(mctx, layout, ring, step) {
    step = step || 1;
    var p0 = minimapProject(layout, ring[0][0], ring[0][1]);
    mctx.moveTo(p0.x, p0.y);
    for (var i = 1; i < ring.length; i += step) {
      var p = minimapProject(layout, ring[i][0], ring[i][1]);
      mctx.lineTo(p.x, p.y);
    }
    mctx.closePath();
  }

  function ensureMinimapLand(opts, layout) {
    var n = opts.geojson && opts.geojson.features ? opts.geojson.features.length : 0;
    var key = layout.mw + 'x' + layout.mh + ':' + n + ':' + layout.bbox.join(',');
    if (minimapLandCache.key === key && minimapLandCache.canvas) return minimapLandCache.canvas;
    var c = document.createElement('canvas');
    c.width = layout.mw;
    c.height = layout.mh;
    var g = c.getContext('2d');
    g.fillStyle = '#08141c';
    g.fillRect(0, 0, c.width, c.height);
    var sea = g.createLinearGradient(0, 0, 0, c.height);
    sea.addColorStop(0, '#163044');
    sea.addColorStop(1, '#0b1c28');
    g.fillStyle = sea;
    g.fillRect(0, 0, c.width, c.height);
    g.beginPath();
    forEachGeoRing(opts.geojson, function (ring) {
      g.beginPath();
      traceGeoRing(g, layout, ring, ring.length > 80 ? 2 : 1);
      g.fillStyle = '#6d854c';
      g.fill();
      g.strokeStyle = 'rgba(40, 55, 28, 0.55)';
      g.lineWidth = 0.6;
      g.stroke();
    });
    minimapLandCache = { key: key, canvas: c };
    return c;
  }

  function drawMinimap(mctx, opts) {
    var mw = opts.width;
    var mh = opts.height;
    mctx.clearRect(0, 0, mw, mh);
    mctx.fillStyle = '#0c1a24';
    mctx.fillRect(0, 0, mw, mh);

    var layout;
    if (opts.geojson || opts.bbox) {
      layout = minimapLayout(opts);
      var land = ensureMinimapLand(opts, layout);
      if (land) mctx.drawImage(land, 0, 0);

      var provOverlay = ensureMinimapProvinces(opts, layout, land);
      if (provOverlay) mctx.drawImage(provOverlay, 0, 0);

      if (opts.highlightRings && opts.highlightRings.length) {
        mctx.beginPath();
        for (var hi = 0; hi < opts.highlightRings.length; hi++) {
          traceGeoRing(mctx, layout, opts.highlightRings[hi], 1);
        }
        mctx.fillStyle = 'rgba(201, 168, 76, 0.38)';
        mctx.fill();
        mctx.strokeStyle = 'rgba(232, 210, 120, 0.95)';
        mctx.lineWidth = 1.4;
        mctx.stroke();
      }

      if (opts.citiesLonLat) {
        for (var ci = 0; ci < opts.citiesLonLat.length; ci++) {
          var city = opts.citiesLonLat[ci];
          var cp = minimapProject(layout, city.lon, city.lat);
          mctx.fillStyle = city.capital ? '#f0d78a' : '#c9a84c';
          mctx.fillRect(cp.x - 1.5, cp.y - 1.5, 3, 3);
        }
      }

      if (opts.viewQuad && opts.viewQuad.length >= 3) {
        mctx.beginPath();
        var q0 = minimapProject(layout, opts.viewQuad[0].lon, opts.viewQuad[0].lat);
        mctx.moveTo(q0.x, q0.y);
        for (var qi = 1; qi < opts.viewQuad.length; qi++) {
          var qp = minimapProject(layout, opts.viewQuad[qi].lon, opts.viewQuad[qi].lat);
          mctx.lineTo(qp.x, qp.y);
        }
        mctx.closePath();
        mctx.fillStyle = 'rgba(90, 200, 255, 0.12)';
        mctx.fill();
        mctx.strokeStyle = 'rgba(255, 230, 90, 0.95)';
        mctx.lineWidth = 1.6;
        mctx.stroke();
      } else if (opts.viewBox) {
        var a = minimapProject(layout, opts.viewBox.minLon, opts.viewBox.maxLat);
        var b = minimapProject(layout, opts.viewBox.maxLon, opts.viewBox.minLat);
        mctx.strokeStyle = 'rgba(255, 230, 90, 0.95)';
        mctx.lineWidth = 1.6;
        mctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      }
      return;
    }

    var pad = 6;
    var mapW = opts.mapW || 1;
    var mapH = opts.mapH || 1;
    var s = Math.min((mw - pad * 2) / mapW, (mh - pad * 2) / mapH);
    var ox = (mw - mapW * s) / 2;
    var oy = (mh - mapH * s) / 2;

    function mp(x, y) {
      return { x: ox + x * s, y: oy + y * s };
    }

    if (opts.provinces) {
      for (var pi = 0; pi < opts.provinces.length; pi++) {
        var pr = opts.provinces[pi];
        if (!pr.rect) continue;
        var p0 = mp(pr.rect.x, pr.rect.y);
        mctx.fillStyle = pr.color || 'rgba(100,100,100,0.4)';
        mctx.fillRect(p0.x, p0.y, pr.rect.w * s, pr.rect.h * s);
      }
    }

    if (opts.landMask && opts.landMask.draw) {
      opts.landMask.draw(mctx, mp, s);
    } else if (opts.outline) {
      mctx.fillStyle = '#6a8248';
      mctx.fillRect(ox, oy, mapW * s, mapH * s * 0.85);
    }

    if (opts.cities) {
      for (var cj = 0; cj < opts.cities.length; cj++) {
        var c = opts.cities[cj];
        var p = mp(c.x, c.y);
        mctx.fillStyle = c.capital ? '#e0c878' : '#c9a84c';
        mctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
    }

    if (opts.viewport) {
      var vp = opts.viewport;
      var cx = (-vp.tx / vp.scale + mapW / 2);
      var cy = (-vp.ty / vp.scale + mapH / 2);
      var vw = vp.vw / vp.scale;
      var vh = vp.vh / vp.scale;
      var r0 = mp(cx - vw / 2, cy - vh / 2);
      mctx.strokeStyle = 'rgba(255, 230, 90, 0.95)';
      mctx.lineWidth = 1.5;
      mctx.strokeRect(r0.x, r0.y, vw * s, vh * s);
    }
  }

  function dayNightOverlay(alpha) {
    var night = Math.max(0, 1 - alpha);
    return 'radial-gradient(ellipse at 50% 28%, rgba(255,230,180,' + (0.04 * night) + ') 0%, rgba(0,12,28,' + (0.06 + 0.12 * night) + ') 65%, rgba(0,0,0,' + (0.08 + 0.12 * night) + ') 100%)';
  }

  function lerpPath(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  global.MapEngine = {
    CAMERA_MODES: CAMERA_MODES,
    BORDER_CYAN: BORDER_CYAN,
    BUILDING_ICONS: BUILDING_ICONS,
    cameraPreset: cameraPreset,
    applyCssTransform: applyCssTransform,
    clampPan: clampPan,
    screenToMap: screenToMap,
    strokeCyanGlow: strokeCyanGlow,
    strokeWindingRoad: strokeWindingRoad,
    drawRoadNetwork: drawRoadNetwork,
    drawRtwCity: drawRtwCity,
    drawArmyStack: drawArmyStack,
    drawFogOverlay: drawFogOverlay,
    drawProvinceShroud: drawProvinceShroud,
    drawMapEvent: drawMapEvent,
    drawSupplyLine: drawSupplyLine,
    drawMinimap: drawMinimap,
    minimapLayout: minimapLayout,
    minimapToLonLat: minimapToLonLat,
    dayNightOverlay: dayNightOverlay,
    lerpPath: lerpPath
  };
})(typeof window !== 'undefined' ? window : this);
