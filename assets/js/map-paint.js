/**
 * Painted overlay for the campaign map (editor → localStorage → ItalyDEM).
 * Per-view keys. Pixel: R=cover, G/B=height+OFFSET, A=255 if height painted.
 */
(function (global) {
  'use strict';
  var KEY_PREFIX = 'campaignMapPaint_v';
  var ACTIVE_KEY = 'campaignMapPaintActiveView';
  var BBOX = [6.4, 36.2, 18.9, 47.4];
  var W = 384;
  var H = 384;
  var OFFSET = 500;
  var canvas = null;
  var ctx = null;
  var px = null;
  var activeView = 12;
  var enabled = true;

  var COVER = {
    none: 0,
    water: 1,
    sand: 2,
    plains: 3,
    forest: 4,
    hills: 5,
    mountains: 6,
    snow: 7,
    road: 8
  };

  var COVER_RGB = {
    1: [48, 118, 148],
    2: [214, 196, 148],
    3: [110, 148, 72],
    4: [42, 88, 42],
    5: [98, 112, 68],
    6: [148, 144, 136],
    7: [232, 236, 240],
    8: [92, 68, 42]
  };

  var COVER_HEIGHT = {
    1: 0,
    2: 12,
    3: 80,
    4: 220,
    5: 650,
    6: 1800,
    7: 2600,
    8: 90
  };

  var VIEW_LABELS = {
    4: 'Вид 4 (Three.js)',
    5: 'Вид 5 (Three.js)',
    10: 'Вид 10 (Three.js)',
    12: 'Вид 12 (Phaser)',
    16: 'Вид 16 (Godot 4)'
  };

  function storageKey(viewId) {
    return KEY_PREFIX + String(viewId == null ? activeView : viewId);
  }

  function ensure() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    px = ctx.getImageData(0, 0, W, H);
  }

  function blank() {
    ensure();
    ctx.clearRect(0, 0, W, H);
    px = ctx.getImageData(0, 0, W, H);
  }

  function flush() {
    if (!ctx || !px) return;
    ctx.putImageData(px, 0, 0);
  }

  function lonLatToUV(lon, lat) {
    return {
      u: (lon - BBOX[0]) / (BBOX[2] - BBOX[0]),
      v: (BBOX[3] - lat) / (BBOX[3] - BBOX[1])
    };
  }

  function sampleIdx(lon, lat) {
    var uv = lonLatToUV(lon, lat);
    if (uv.u < 0 || uv.v < 0 || uv.u > 1 || uv.v > 1) return -1;
    var x = Math.max(0, Math.min(W - 1, Math.round(uv.u * (W - 1))));
    var y = Math.max(0, Math.min(H - 1, Math.round(uv.v * (H - 1))));
    return (y * W + x) * 4;
  }

  function coverAt(lon, lat) {
    if (!px) return 0;
    var i = sampleIdx(lon, lat);
    if (i < 0) return 0;
    return px.data[i] || 0;
  }

  function applyHeight(lon, lat, m) {
    if (!enabled || !px) return m;
    var i = sampleIdx(lon, lat);
    if (i < 0) return m;
    var d = px.data;
    var cover = d[i];
    if (d[i + 3] > 8) {
      return d[i + 1] * 256 + d[i + 2] - OFFSET;
    }
    if (cover && COVER_HEIGHT[cover] != null) return COVER_HEIGHT[cover];
    return m;
  }

  function applyColor(col, lon, lat) {
    if (!enabled || !px) return col;
    var cover = coverAt(lon, lat);
    var rgb = COVER_RGB[cover];
    if (!rgb) return col;
    return [
      Math.round(col[0] * 0.18 + rgb[0] * 0.82),
      Math.round(col[1] * 0.18 + rgb[1] * 0.82),
      Math.round(col[2] * 0.18 + rgb[2] * 0.82)
    ];
  }

  function stampHeight(h) {
    var v = Math.max(0, Math.min(65535, Math.round(h + OFFSET)));
    return { g: (v >> 8) & 255, b: v & 255 };
  }

  function paintBrush(cx, cy, radius, cover, strength) {
    ensure();
    cx = Math.round(cx);
    cy = Math.round(cy);
    var d = px.data;
    var r = Math.max(1, Math.round(radius));
    var x0 = Math.max(0, cx - r);
    var y0 = Math.max(0, cy - r);
    var x1 = Math.min(W - 1, cx + r);
    var y1 = Math.min(H - 1, cy + r);
    var ht = COVER_HEIGHT[cover];
    var packed = (cover && ht != null) ? stampHeight(ht) : null;
    var erase = !cover;
    var x, y, dx, dy, dist, i, k;
    for (y = y0; y <= y1; y++) {
      for (x = x0; x <= x1; x++) {
        dx = x - cx;
        dy = y - cy;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > r) continue;
        k = (1 - dist / r) * (strength == null ? 1 : strength);
        if (k < 0.05) continue;
        i = (y * W + x) * 4;
        if (erase) {
          d[i] = 0;
          d[i + 1] = 0;
          d[i + 2] = 0;
          d[i + 3] = 0;
          continue;
        }
        d[i] = cover & 255;
        if (packed) {
          d[i + 1] = packed.g;
          d[i + 2] = packed.b;
          d[i + 3] = 255;
        } else {
          d[i + 1] = d[i + 1] || 0;
          d[i + 2] = d[i + 2] || 0;
          d[i + 3] = 255;
        }
      }
    }
  }

  function save(viewId) {
    ensure();
    flush();
    try {
      localStorage.setItem(storageKey(viewId), canvas.toDataURL('image/png'));
      localStorage.setItem(ACTIVE_KEY, String(viewId == null ? activeView : viewId));
    } catch (_) {}
  }

  function load(viewId) {
    ensure();
    if (viewId != null) activeView = Number(viewId) || activeView;
    return new Promise(function (resolve) {
      var url = null;
      try {
        url = localStorage.getItem(storageKey(activeView));
        // legacy single-key migration
        if (!url && activeView === 12) url = localStorage.getItem('campaignMapPaintV1');
      } catch (_) {}
      if (!url) {
        blank();
        resolve(false);
        return;
      }
      var img = new Image();
      img.onload = function () {
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0, W, H);
        px = ctx.getImageData(0, 0, W, H);
        resolve(true);
      };
      img.onerror = function () {
        blank();
        resolve(false);
      };
      img.src = url;
    });
  }

  function setView(viewId) {
    activeView = Number(viewId) || 12;
    try { localStorage.setItem(ACTIVE_KEY, String(activeView)); } catch (_) {}
    return load(activeView);
  }

  function getView() {
    return activeView;
  }

  function initFromStorage() {
    try {
      var v = Number(localStorage.getItem(ACTIVE_KEY));
      if (v) activeView = v;
    } catch (_) {}
    return load(activeView);
  }

  function clearAll(viewId) {
    ensure();
    blank();
    try {
      localStorage.removeItem(storageKey(viewId == null ? activeView : viewId));
    } catch (_) {}
  }

  function overlayCanvas() {
    ensure();
    flush();
    return canvas;
  }

  function previewCanvas() {
    ensure();
    flush();
    var out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    var o = out.getContext('2d');
    var img = o.createImageData(W, H);
    var d = px.data, q = img.data, i, c, rgb;
    for (i = 0; i < d.length; i += 4) {
      c = d[i];
      rgb = COVER_RGB[c];
      if (!rgb) continue;
      q[i] = rgb[0];
      q[i + 1] = rgb[1];
      q[i + 2] = rgb[2];
      q[i + 3] = 220;
    }
    o.putImageData(img, 0, 0);
    return out;
  }

  // bootstrap active view id early
  try {
    var boot = Number(localStorage.getItem(ACTIVE_KEY));
    if (boot) activeView = boot;
  } catch (_) {}

  global.MapPaint = {
    KEY_PREFIX: KEY_PREFIX,
    W: W,
    H: H,
    BBOX: BBOX,
    COVER: COVER,
    COVER_RGB: COVER_RGB,
    COVER_HEIGHT: COVER_HEIGHT,
    VIEW_LABELS: VIEW_LABELS,
    ensure: ensure,
    load: load,
    save: save,
    clearAll: clearAll,
    setView: setView,
    getView: getView,
    initFromStorage: initFromStorage,
    setEnabled: function (on) { enabled = !!on; },
    isEnabled: function () { return enabled; },
    paintBrush: paintBrush,
    flush: flush,
    applyHeight: applyHeight,
    applyColor: applyColor,
    coverAt: coverAt,
    overlayCanvas: overlayCanvas,
    previewCanvas: previewCanvas,
    ready: function () { return !!px; }
  };
})(typeof window !== 'undefined' ? window : this);
