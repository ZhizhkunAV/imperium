/**
 * Shared Italy SRTM heightmap: load, sample, geographic paint.
 */
(function (global) {
  'use strict';
  var BBOX = [6.4, 36.2, 18.9, 47.4];
  var OFFSET = 500;
  var DEM = null;
  var loading = null;

  function load(url) {
    if (DEM) return Promise.resolve(true);
    if (loading) return loading;
    url = url || '/maps/rome/italy-height.png';
    loading = new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          var g = c.getContext('2d');
          g.drawImage(img, 0, 0);
          var px = g.getImageData(0, 0, img.width, img.height).data;
          var data = new Float32Array(img.width * img.height);
          for (var i = 0; i < data.length; i++) data[i] = px[i * 4] * 256 + px[i * 4 + 1] - OFFSET;
          DEM = { w: img.width, h: img.height, data: data };
          resolve(true);
        } catch (e) { resolve(false); }
      };
      img.onerror = function () { resolve(false); };
      img.src = url;
    });
    return loading;
  }

  function meters(lon, lat) {
    if (!DEM) return null;
    var u = (lon - BBOX[0]) / (BBOX[2] - BBOX[0]);
    var v = (BBOX[3] - lat) / (BBOX[3] - BBOX[1]);
    if (u < 0 || v < 0 || u > 1 || v > 1) return 0;
    var x = u * (DEM.w - 1), y = v * (DEM.h - 1);
    var x0 = Math.floor(x), y0 = Math.floor(y);
    var x1 = Math.min(DEM.w - 1, x0 + 1), y1 = Math.min(DEM.h - 1, y0 + 1);
    var tx = x - x0, ty = y - y0, d = DEM.data, w = DEM.w;
    return d[y0 * w + x0] * (1 - tx) * (1 - ty) + d[y0 * w + x1] * tx * (1 - ty)
      + d[y1 * w + x0] * (1 - tx) * ty + d[y1 * w + x1] * tx * ty;
  }

  function isLand(lon, lat, minM) {
    var m = meters(lon, lat);
    return m != null && m > (minM == null ? 8 : minM);
  }

  function lerp3(a, b, t) {
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  function rgbForMeters(m) {
    if (!(m > 4)) return [24, 72, 92];
    var stops = [
      [8, [150, 142, 104]],
      [50, [124, 122, 78]],
      [160, [98, 112, 68]],
      [380, [86, 104, 62]],
      [750, [94, 100, 66]],
      [1200, [118, 112, 90]],
      [1750, [138, 132, 116]],
      [2300, [188, 190, 184]],
      [3100, [228, 230, 226]]
    ];
    var i, t, a, b;
    if (m <= stops[0][0]) return stops[0][1];
    for (i = 1; i < stops.length; i++) {
      if (m <= stops[i][0]) {
        a = stops[i - 1];
        b = stops[i];
        t = (m - a[0]) / (b[0] - a[0]);
        return lerp3(a[1], b[1], t);
      }
    }
    return stops[stops.length - 1][1];
  }

  function paintGeo(w, h, box, opts) {
    opts = opts || {};
    box = box || BBOX;
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var g = c.getContext('2d');
    var sea = opts.sea || '#1a4e60';
    g.fillStyle = sea;
    g.fillRect(0, 0, w, h);
    if (!DEM) return c;
    var img = g.getImageData(0, 0, w, h);
    var px = img.data;
    var elev = new Float32Array(w * h);
    var i, x, y, lon, lat, m, col, shade, mx, my, nx, ny, nlen, k;
    for (y = 0; y < h; y++) {
      lat = box[3] - y / Math.max(1, h - 1) * (box[3] - box[1]);
      for (x = 0; x < w; x++) {
        lon = box[0] + x / Math.max(1, w - 1) * (box[2] - box[0]);
        m = meters(lon, lat);
        elev[y * w + x] = m == null ? 0 : m;
      }
    }
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        m = elev[y * w + x];
        i = (y * w + x) * 4;
        if (!(m > 6)) {
          k = Math.max(0, Math.min(1, (8 - m) / 50));
          col = lerp3([48, 98, 112], [16, 46, 62], k);
          px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2]; px[i + 3] = 255;
          continue;
        }
        col = rgbForMeters(m);
        mx = x + 1 < w ? elev[y * w + x + 1] : m;
        my = y + 1 < h ? elev[(y + 1) * w + x] : m;
        nx = m - mx;
        ny = m - my;
        nlen = Math.sqrt(nx * nx + ny * ny + 90 * 90) || 1;
        shade = Math.max(0.62, Math.min(1.28, (nx * 0.48 + 90) / nlen * 1.48));
        px[i] = Math.max(0, Math.min(255, col[0] * shade));
        px[i + 1] = Math.max(0, Math.min(255, col[1] * shade));
        px[i + 2] = Math.max(0, Math.min(255, col[2] * shade));
        px[i + 3] = 255;
      }
    }
    sharpenCoast(px, elev, w, h);
    g.putImageData(img, 0, 0);
    return c;
  }

  function sharpenCoast(px, elev, w, h) {
    var x, y, i, m, land, nSea, nLand, t;
    function sample(ix, iy) {
      if (ix < 0 || iy < 0 || ix >= w || iy >= h) return 0;
      return elev[iy * w + ix];
    }
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        m = elev[y * w + x];
        land = m > 6;
        nSea = (sample(x - 1, y) <= 6 ? 1 : 0) + (sample(x + 1, y) <= 6 ? 1 : 0)
          + (sample(x, y - 1) <= 6 ? 1 : 0) + (sample(x, y + 1) <= 6 ? 1 : 0);
        nLand = 4 - nSea;
        i = (y * w + x) * 4;
        if (land && nSea > 0) {
          t = nSea >= 2 ? 0.72 : 0.42;
          px[i] = px[i] * (1 - t) + 186 * t;
          px[i + 1] = px[i + 1] * (1 - t) + 168 * t;
          px[i + 2] = px[i + 2] * (1 - t) + 118 * t;
          if (nSea >= 2) {
            px[i] = px[i] * 0.72 + 52 * 0.28;
            px[i + 1] = px[i + 1] * 0.72 + 48 * 0.28;
            px[i + 2] = px[i + 2] * 0.72 + 38 * 0.28;
          }
        } else if (!land && nLand > 0) {
          t = nLand >= 2 ? 0.55 : 0.28;
          px[i] = px[i] * (1 - t) + 72 * t;
          px[i + 1] = px[i + 1] * (1 - t) + 128 * t;
          px[i + 2] = px[i + 2] * (1 - t) + 138 * t;
        }
      }
    }
  }

  /**
   * Height mesh with interpolated coastline (no stair-step quads).
   * opts: box, cols, rows, sea, toXZ(lon,lat)->{x,z}, height(lon,lat,m)->y
   */
  function buildHeightMesh(opts) {
    opts = opts || {};
    var box = opts.box || BBOX;
    var cols = opts.cols || 380;
    var rows = opts.rows || 440;
    var seaM = opts.sea == null ? 8 : opts.sea;
    var toXZ = opts.toXZ;
    var heightFn = opts.height;
    var coastY = opts.coastY == null ? 0.05 : opts.coastY;
    var positions = [];
    var uvs = [];
    var indices = [];
    var metersArr = [];
    var i, j, lon, lat, m, p, y, k;
    var stride = cols + 1;

    function pushV(x, yv, z, u, v) {
      var id = positions.length / 3;
      positions.push(x, yv, z);
      uvs.push(u, v);
      return id;
    }

    for (j = 0; j <= rows; j++) {
      for (i = 0; i <= cols; i++) {
        lon = box[0] + (box[2] - box[0]) * i / cols;
        lat = box[3] - (box[3] - box[1]) * j / rows;
        m = meters(lon, lat);
        if (m == null) m = 0;
        p = toXZ(lon, lat);
        y = m > seaM ? heightFn(lon, lat, m) : 0;
        pushV(p.x, y, p.z, i / cols, 1 - j / rows);
        metersArr.push(m);
      }
    }

    function landAt(idx) { return metersArr[idx] > seaM; }

    function interp(ia, ib) {
      var ma = metersArr[ia], mb = metersArr[ib];
      var t = (seaM - ma) / ((mb - ma) || 1e-6);
      if (t < 0.02) t = 0.02;
      if (t > 0.98) t = 0.98;
      return pushV(
        positions[ia * 3] + (positions[ib * 3] - positions[ia * 3]) * t,
        coastY,
        positions[ia * 3 + 2] + (positions[ib * 3 + 2] - positions[ia * 3 + 2]) * t,
        uvs[ia * 2] + (uvs[ib * 2] - uvs[ia * 2]) * t,
        uvs[ia * 2 + 1] + (uvs[ib * 2 + 1] - uvs[ia * 2 + 1]) * t
      );
    }

    function emit(ring) {
      if (ring.length < 3) return;
      for (k = 1; k < ring.length - 1; k++) indices.push(ring[0], ring[k], ring[k + 1]);
    }

    function walk(A, B, C, D) {
      var ring = [];
      function edge(i0, i1) {
        var l0 = landAt(i0), l1 = landAt(i1);
        if (l0) ring.push(i0);
        if (l0 !== l1) ring.push(interp(i0, i1));
      }
      edge(A, C); edge(C, D); edge(D, B); edge(B, A);
      emit(ring);
    }

    for (j = 0; j < rows; j++) {
      for (i = 0; i < cols; i++) {
        var A = j * stride + i;
        var B = A + 1;
        var C = A + stride;
        var D = C + 1;
        var la = landAt(A), lb = landAt(B), lc = landAt(C), ld = landAt(D);
        var n = (la ? 1 : 0) + (lb ? 1 : 0) + (lc ? 1 : 0) + (ld ? 1 : 0);
        if (n === 0) continue;
        if (n === 4) {
          indices.push(A, C, B, B, C, D);
          continue;
        }
        if (n === 2 && la && ld && !lb && !lc) {
          emit([A, interp(A, C), interp(A, B)]);
          emit([D, interp(D, B), interp(D, C)]);
          continue;
        }
        if (n === 2 && lb && lc && !la && !ld) {
          emit([B, interp(B, A), interp(B, D)]);
          emit([C, interp(C, D), interp(C, A)]);
          continue;
        }
        walk(A, B, C, D);
      }
    }

    return { positions: positions, uvs: uvs, indices: indices };
  }

  global.ItalyDEM = {
    load: load,
    meters: meters,
    isLand: isLand,
    rgbForMeters: rgbForMeters,
    paintGeo: paintGeo,
    buildHeightMesh: buildHeightMesh,
    bbox: BBOX,
    ready: function () { return !!DEM; }
  };
})(typeof window !== 'undefined' ? window : this);
