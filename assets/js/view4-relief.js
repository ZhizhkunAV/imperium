/**
 * Вид 4 — видимый рельеф (столбики высоты), как на кампании RTW / M2TW.
 * Подложка остаётся HD; поверх рисуются склоны, которые растут с наклоном камеры.
 */
(function (global) {
  'use strict';

  var MAX_EDGE = 1600;
  var host = null;
  var canvas = null;
  var ctx = null;
  var lastKey = '';
  var height = null;
  var shade = null;
  var landRGB = null;
  var landMask = null;
  var hmW = 0;
  var hmH = 0;
  var lastTilt = -1;
  var pendingTilt = 60;
  var raf = 0;

  var RIVERS = [
    [[7.7, 45.05], [8.5, 45.08], [9.4, 45.07], [10.5, 45.02], [11.6, 44.98], [12.4, 45.05]],
    [[12.52, 43.15], [12.5, 42.55], [12.48, 41.9], [12.4, 41.74]],
    [[11.0, 43.78], [11.25, 43.77], [11.55, 43.72], [10.9, 43.55]]
  ];
  var ALPS = [
    [7.35, 45.7], [8.2, 45.95], [9.15, 46.15], [10.2, 46.25], [11.2, 46.4], [12.3, 46.5], [13.4, 46.55]
  ];
  var APENNINES = [
    [8.9, 44.45], [9.8, 44.2], [10.7, 43.85], [11.5, 43.2], [12.3, 42.55],
    [13.15, 41.85], [14.05, 41.2], [15.0, 40.55], [16.05, 39.7], [16.45, 38.95]
  ];

  function noise(x, y) {
    var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }
  function valueNoise(x, y) {
    var x0 = Math.floor(x);
    var y0 = Math.floor(y);
    var fx = x - x0;
    var fy = y - y0;
    var u = fx * fx * (3 - 2 * fx);
    var v = fy * fy * (3 - 2 * fy);
    var a = noise(x0, y0);
    var b = noise(x0 + 1, y0);
    var c = noise(x0, y0 + 1);
    var d = noise(x0 + 1, y0 + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y) {
    return valueNoise(x, y) * 0.55 + valueNoise(x * 2.1, y * 2.1) * 0.28 + valueNoise(x * 4.3, y * 4.3) * 0.17;
  }
  function distToPoly(lon, lat, pts) {
    var best = 1e9;
    for (var i = 0; i < pts.length - 1; i++) {
      var ax = pts[i][0], ay = pts[i][1];
      var bx = pts[i + 1][0], by = pts[i + 1][1];
      var dx = bx - ax, dy = by - ay;
      var l2 = dx * dx + dy * dy || 1e-6;
      var t = Math.max(0, Math.min(1, ((lon - ax) * dx + (lat - ay) * dy) / l2));
      var px = ax + dx * t;
      var py = ay + dy * t;
      var d = (lon - px) * (lon - px) + (lat - py) * (lat - py);
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  }
  function ridge(lon, lat, pts, width, peak) {
    var d = distToPoly(lon, lat, pts);
    var t = Math.max(0, 1 - d / width);
    return peak * t * t;
  }
  function blur(src, w, h, passes) {
    var a = src;
    var b = new Float32Array(w * h);
    for (var p = 0; p < passes; p++) {
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var s = 0, n = 0, oy, ox, yy, xx;
          for (oy = -1; oy <= 1; oy++) {
            yy = y + oy;
            if (yy < 0 || yy >= h) continue;
            for (ox = -1; ox <= 1; ox++) {
              xx = x + ox;
              if (xx < 0 || xx >= w) continue;
              s += a[yy * w + xx];
              n++;
            }
          }
          b[y * w + x] = s / n;
        }
      }
      var tmp = a; a = b; b = tmp;
    }
    return a;
  }

  function ensureHost(stage) {
    host = document.getElementById('mapRelief');
    if (!host && stage) {
      host = document.createElement('div');
      host.id = 'mapRelief';
      host.className = 'map-relief';
      stage.insertBefore(host, stage.querySelector('#mapTerrain') || stage.querySelector('#mapCanvas') || null);
    }
    if (host && !canvas) {
      host.innerHTML = '';
      canvas = document.createElement('canvas');
      canvas.className = 'map-relief-view';
      host.appendChild(canvas);
      ctx = canvas.getContext('2d');
    }
    return host && ctx;
  }

  function rebuild(opts) {
    opts = opts || {};
    if (!ensureHost(opts.stage) || !opts.mapImage || !opts.labelData) {
      lastKey = '';
      return;
    }
    var img = opts.mapImage;
    var labelData = opts.labelData;
    var regions = opts.pixelRegions || [];
    var unproject = opts.unprojectLonLat;
    var provinceTerrain = opts.provinceTerrain || {};
    var key = [img.src, labelData.width, opts.canvasW, opts.canvasH].join(':');
    if (key === lastKey && height) {
      setActive(true);
      renderTilt(pendingTilt, true);
      return;
    }
    lastKey = key;

    var lw = labelData.width;
    var lh = labelData.height;
    var k = Math.min(1, MAX_EDGE / Math.max(lw, lh));
    hmW = Math.max(8, Math.round(lw * k));
    hmH = Math.max(8, Math.round(lh * k));
    canvas.width = hmW;
    canvas.height = hmH;

    var land = document.createElement('canvas');
    land.width = hmW;
    land.height = hmH;
    var lctx = land.getContext('2d');
    lctx.imageSmoothingEnabled = true;
    lctx.imageSmoothingQuality = 'high';
    lctx.drawImage(img, 0, 0, hmW, hmH);
    var srcPix = lctx.getImageData(0, 0, hmW, hmH).data;

    var lab = document.createElement('canvas');
    lab.width = hmW;
    lab.height = hmH;
    var bctx = lab.getContext('2d');
    bctx.imageSmoothingEnabled = false;
    var labFull = document.createElement('canvas');
    labFull.width = lw;
    labFull.height = lh;
    labFull.getContext('2d').putImageData(labelData, 0, 0);
    bctx.drawImage(labFull, 0, 0, hmW, hmH);
    var labPix = bctx.getImageData(0, 0, hmW, hmH).data;

    var codeTerrain = {};
    for (var ri = 0; ri < regions.length; ri++) {
      var r = regions[ri];
      codeTerrain[(r.index != null ? r.index : ri) + 1] = provinceTerrain[r.id] || 'grass';
    }

    var inland = new Float32Array(hmW * hmH);
    landMask = new Uint8Array(hmW * hmH);
    landRGB = new Uint8Array(hmW * hmH * 3);
    height = new Float32Array(hmW * hmH);
    shade = new Float32Array(hmW * hmH);

    var x, y, i, o, codev;
    for (y = 0; y < hmH; y++) {
      for (x = 0; x < hmW; x++) {
        i = y * hmW + x;
        o = i * 4;
        codev = labPix[o];
        landMask[i] = codev ? 1 : 0;
        inland[i] = codev ? 1 : 0;
        landRGB[i * 3] = srcPix[o];
        landRGB[i * 3 + 1] = srcPix[o + 1];
        landRGB[i * 3 + 2] = srcPix[o + 2];
      }
    }
    inland = blur(inland, hmW, hmH, 5);

    for (y = 0; y < hmH; y++) {
      for (x = 0; x < hmW; x++) {
        i = y * hmW + x;
        if (!landMask[i]) {
          height[i] = 0;
          continue;
        }
        var ll = unproject ? unproject(x / hmW, y / hmH) : [12.5, 42];
        codev = labPix[i * 4];
        var type = codeTerrain[codev] || 'grass';
        var base = type === 'mountain' ? 0.62 : type === 'hills' ? 0.38 : type === 'forest' ? 0.22 : 0.14;
        var n = fbm(x / 28, y / 28);
        var h = base + (n - 0.45) * (type === 'mountain' ? 0.28 : 0.12);
        h += ridge(ll[0], ll[1], ALPS, 1.2, 0.62);
        h += ridge(ll[0], ll[1], APENNINES, 0.78, 0.5);
        h *= Math.max(0.16, Math.min(1, inland[i] * 1.2));
        for (var rv = 0; rv < RIVERS.length; rv++) {
          var rd = distToPoly(ll[0], ll[1], RIVERS[rv]);
          if (rd < 0.16) h -= (1 - rd / 0.16) * 0.16;
        }
        height[i] = Math.max(0.03, Math.min(1, h));
      }
    }
    height = blur(height, hmW, hmH, 2);

    for (y = 1; y < hmH - 1; y++) {
      for (x = 1; x < hmW - 1; x++) {
        i = y * hmW + x;
        if (!landMask[i]) continue;
        var dx = height[i + 1] - height[i - 1];
        var dy = height[i + hmW] - height[i - hmW];
        shade[i] = Math.max(0.35, Math.min(1.25, 0.72 + (-dx * 2.1 - dy * 1.15) * 2.2));
      }
    }

    setActive(true);
    lastTilt = -1;
    renderTilt(typeof opts.tilt === 'number' ? opts.tilt : pendingTilt, true);
  }

  function renderTilt(deg, force) {
    pendingTilt = deg;
    if (!ctx || !height) return;
    if (!force && Math.abs(deg - lastTilt) < 0.4) return;
    lastTilt = deg;
    var t = Math.max(0, Math.min(75, deg)) * Math.PI / 180;
    var extrude = Math.sin(t) * Math.min(hmH * 0.085, 92);
    var img = ctx.createImageData(hmW, hmH);
    var dst = img.data;
    var x, y, i, o, ty, face, hgt, sh, r, g, b, p, yy;

    for (i = 0; i < hmW * hmH; i++) {
      o = i * 4;
      dst[o + 3] = 0;
    }

    for (y = 0; y < hmH; y++) {
      for (x = 0; x < hmW; x++) {
        i = y * hmW + x;
        if (!landMask[i]) continue;
        if (height[i] < 0.26) continue;
        hgt = height[i] * extrude;
        if (hgt < 1.4) continue;
        ty = Math.max(0, Math.min(hmH - 1, Math.round(y - hgt)));
        sh = shade[i] || 0.8;
        r = Math.min(255, landRGB[i * 3] * sh);
        g = Math.min(255, landRGB[i * 3 + 1] * sh);
        b = Math.min(255, landRGB[i * 3 + 2] * sh);
        face = Math.max(1, Math.round(hgt));
        for (p = 0; p < face; p++) {
          yy = y - p;
          if (yy < 0) break;
          o = (yy * hmW + x) * 4;
          var kFace = 0.38 + 0.22 * (p / face);
          dst[o] = Math.round(r * kFace + 62 * (1 - kFace));
          dst[o + 1] = Math.round(g * kFace + 48 * (1 - kFace));
          dst[o + 2] = Math.round(b * kFace + 34 * (1 - kFace));
          dst[o + 3] = 255;
        }
        o = (ty * hmW + x) * 4;
        dst[o] = Math.round(r);
        dst[o + 1] = Math.round(g);
        dst[o + 2] = Math.round(b);
        dst[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function queueTilt(deg) {
    pendingTilt = deg;
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      renderTilt(pendingTilt, false);
    });
  }

  function setActive(on) {
    if (!host) return;
    host.classList.toggle('is-on', Boolean(on));
  }

  global.View4Relief = {
    rebuild: rebuild,
    renderTilt: queueTilt,
    setActive: setActive
  };
})(typeof window !== 'undefined' ? window : this);
