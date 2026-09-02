const fs = require('fs');
const path = 'C:/Users/Пользователь/Desktop/AI/my-website/assets/maps/view10/map.html';
let s = fs.readFileSync(path, 'utf8');

const camBlock = `  /** Phaser Mesh: карта в плоскости XY (лицом к камере). Зум = дистанция, наклон = rotX. */
  function phaserTiltRad(tiltDeg) {
    // высокий % — почти сверху; низкий — сильнее перспектива сбоку
    var t = Math.max(10, Math.min(TILT_MAX, tiltDeg));
    return 0.92 - ((t - 10) / (TILT_MAX - 10)) * 0.72; // ~0.92…0.20
  }
  function phaserZoomClamp(z) {
    return Math.max(0.5, Math.min(2.4, z));
  }
  function applyPhaserCam() {
    var pack = current.phaser;
    if (!pack || !pack.game) return;
    stage.style.perspective = 'none';
    stage.style.perspectiveOrigin = 'center center';
    stage.style.background = '#163c4c';
    var canvas = stage.querySelector('canvas');
    if (canvas) {
      canvas.style.transform = 'none';
      canvas.style.transformOrigin = 'center center';
      canvas.style.cursor = 'grab';
    }
    try {
      var sc = pack.game.scene && pack.game.scene.scenes && pack.game.scene.scenes[0];
      if (sc && sc.cameras && sc.cameras.main) {
        sc.cameras.main.setZoom(1);
        sc.cameras.main.setScroll(0, 0);
        sc.cameras.main.setRotation(0);
        sc.cameras.main.setBackgroundColor('#163c4c');
      }
      var w = sc && sc.scale ? Math.max(1, sc.scale.width) : window.innerWidth || 1024;
      var h = sc && sc.scale ? Math.max(1, sc.scale.height) : window.innerHeight || 768;
      var z = phaserZoomClamp(camZoom);
      // масштаб постоянный — карта не схлопывается в полоску при удалении
      var sScale = pack.baseScale || 1.28;
      var dist = Math.max(3.4, Math.min(10.5, (pack.baseZ || 5.6) / z));
      var rotX = phaserTiltRad(camTilt);
      var panLim = 1.65 / Math.max(0.85, sScale);
      pack.panX = Math.max(-panLim, Math.min(panLim, pack.panX || 0));
      pack.panY = Math.max(-panLim, Math.min(panLim, pack.panY || 0));
      var meshes = pack.meshes && pack.meshes.length ? pack.meshes : (pack.terrain ? [pack.terrain] : []);
      var i, mesh;
      for (i = 0; i < meshes.length; i++) {
        mesh = meshes[i];
        if (!mesh || !mesh.modelRotation) continue;
        mesh.setPosition(w / 2, h / 2);
        if (typeof mesh.setSize === 'function') mesh.setSize(w, h);
        else { mesh.width = w; mesh.height = h; }
        if (typeof mesh.setPerspective === 'function') mesh.setPerspective(w, h, 45, 0.45, 80);
        if (mesh.viewPosition) {
          mesh.viewPosition.x = 0;
          mesh.viewPosition.y = 0;
          mesh.viewPosition.z = dist;
        }
        if (mesh.dirtyCache) {
          mesh.dirtyCache[10] = 1;
          mesh.dirtyCache[9] = -1;
        }
        mesh.modelRotation.x = rotX;
        mesh.modelRotation.y = camYaw * Math.PI / 180;
        mesh.modelRotation.z = 0;
        mesh.modelPosition.x = pack.panX || 0;
        mesh.modelPosition.y = pack.panY || 0;
        mesh.modelPosition.z = 0;
        if (mesh.modelScale) {
          mesh.modelScale.x = sScale;
          mesh.modelScale.y = sScale;
          mesh.modelScale.z = sScale;
        }
        mesh.ignoreDirtyCache = true;
        if (typeof mesh.preUpdate === 'function') mesh.preUpdate();
        mesh.ignoreDirtyCache = false;
      }
      if (pack.syncProps) pack.syncProps();
    } catch (_) {}
  }
`;

const start = s.indexOf('  /** Phaser Mesh');
const end = s.indexOf('  function applyCam()');
if (start < 0 || end < 0) {
  console.error('cam markers', start, end);
  process.exit(1);
}
s = s.slice(0, start) + camBlock + s.slice(end);

s = s.replace(
  /var minZ = \(current\.name === 'phaser'\) \? 0\.45 : MIN_ZOOM;\s*var maxZ = \(current\.name === 'phaser'\) \? 2\.2 : MAX_ZOOM;/,
  "var minZ = (current.name === 'phaser') ? 0.5 : MIN_ZOOM;\n    var maxZ = (current.name === 'phaser') ? 2.4 : MAX_ZOOM;"
);

// --- rebuild mesh as XY plane ---
const oldVerts = `      for (j = 0; j <= rows; j++) {
        lat = bbox[3] - j / rows * latSpan;
        z = (j / rows - 0.5) * mapD;
        for (i = 0; i <= cols; i++) {
          lon = bbox[0] + i / cols * lonSpan;
          x = (i / cols - 0.5) * mapW;
          m = (window.ItalyDEM && ItalyDEM.ready()) ? (ItalyDEM.meters(lon, lat) || 0) : 0;
          y = elevY(m, lat, lon);
          if (!(m > seaM)) y = -0.025;
          verts.push(x, y, z);
          uvs.push(i / cols, j / rows);
          heights.push(y);
          landMask.push(m > seaM ? 1 : 0);
        }
      }
      stride = cols + 1;
      for (j = 0; j <= rows; j++) {
        for (i = 0; i <= cols; i++) {
          var hL = heights[j * stride + Math.max(0, i - 1)];
          var hR = heights[j * stride + Math.min(cols, i + 1)];
          var hU = heights[Math.max(0, j - 1) * stride + i];
          var hD = heights[Math.min(rows, j + 1) * stride + i];
          nx = (hL - hR) * 2.4;
          nz = (hU - hD) * 2.4;
          ny = 0.48;
          nlen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          shade = 0.58 + 0.48 * Math.max(0, (nx * lx + ny * ly + nz * lz) / nlen);
          byte = Math.max(110, Math.min(255, Math.round(shade * 255)));
          colors.push((byte << 16) | (byte << 8) | byte);
        }
      }`;

const newVerts = `      // XY-плоскость лицом к камере: X=lon, Y=lat (север вверх), Z=высота
      for (j = 0; j <= rows; j++) {
        lat = bbox[3] - j / rows * latSpan;
        z = (0.5 - j / rows) * mapD;
        for (i = 0; i <= cols; i++) {
          lon = bbox[0] + i / cols * lonSpan;
          x = (i / cols - 0.5) * mapW;
          m = (window.ItalyDEM && ItalyDEM.ready()) ? (ItalyDEM.meters(lon, lat) || 0) : 0;
          y = elevY(m, lat, lon);
          if (!(m > seaM)) y = -0.01;
          verts.push(x, z, y);
          uvs.push(i / cols, j / rows);
          heights.push(y);
          landMask.push(m > seaM ? 1 : 0);
        }
      }
      stride = cols + 1;
      for (j = 0; j <= rows; j++) {
        for (i = 0; i <= cols; i++) {
          var hL = heights[j * stride + Math.max(0, i - 1)];
          var hR = heights[j * stride + Math.min(cols, i + 1)];
          var hU = heights[Math.max(0, j - 1) * stride + i];
          var hD = heights[Math.min(rows, j + 1) * stride + i];
          nx = (hL - hR) * 2.2;
          ny = (hU - hD) * 2.2;
          nz = 0.55;
          nlen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          shade = 0.55 + 0.5 * Math.max(0, (nx * lx + ny * ly + nz * lz) / nlen);
          byte = Math.max(110, Math.min(255, Math.round(shade * 255)));
          colors.push((byte << 16) | (byte << 8) | byte);
        }
      }`;

if (!s.includes(oldVerts.slice(0, 80))) {
  console.error('verts block not found');
  process.exit(1);
}
s = s.replace(oldVerts, newVerts);

// elevY — умеренный рельеф для XY
s = s.replace(
  /function elevY\(m, lat, lon\) \{\s*if \(!\(m > 6\)\) return -0\.015;\s*var t = Math\.min\(1, Math\.max\(0, m \/ 3200\)\);\s*\/\/[^\n]*\n\s*return 0\.01 \+ Math\.pow\(t, 1\.2\) \* 0\.18;\s*\}/,
  `function elevY(m, lat, lon) {
      if (!(m > 6)) return -0.01;
      var t = Math.min(1, Math.max(0, m / 3200));
      return 0.008 + Math.pow(t, 1.15) * 0.22;
    }`
);

// lonLatToModel: z = plane Y (север)
s = s.replace(
  `function lonLatToModel(lon, lat) {
      return {
        x: ((lon - bbox[0]) / lonSpan - 0.5) * mapW,
        z: ((bbox[3] - lat) / latSpan - 0.5) * mapD
      };
    }`,
  `function lonLatToModel(lon, lat) {
      return {
        x: ((lon - bbox[0]) / lonSpan - 0.5) * mapW,
        z: ((lat - bbox[1]) / latSpan - 0.5) * mapD
      };
    }`
);

// heightXZ: z arg is plane Y
s = s.replace(
  `function heightXZ(x, z) {
      var lon = bbox[0] + (x / mapW + 0.5) * lonSpan;
      var lat = bbox[3] - (z / mapD + 0.5) * latSpan;
      var m = (window.ItalyDEM && ItalyDEM.ready()) ? ItalyDEM.meters(lon, lat) : 0;
      return elevY(m || 0, lat, lon);
    }`,
  `function heightXZ(x, z) {
      var lon = bbox[0] + (x / mapW + 0.5) * lonSpan;
      var lat = bbox[1] + (z / mapD + 0.5) * latSpan;
      var m = (window.ItalyDEM && ItalyDEM.ready()) ? ItalyDEM.meters(lon, lat) : 0;
      return elevY(m || 0, lat, lon);
    }`
);

// projectModel(x, elev, planeY) — verts are (x, planeY, elev)
s = s.replace(
  `function projectModel(x, y, z) {
      var mesh = current.phaser && current.phaser.terrain;
      if (!mesh || !mesh.transformMatrix) return { x: 0, y: 0, scale: 1 };
      try {
        if (typeof mesh.preUpdate === 'function') mesh.preUpdate();
      } catch (_) {}
      var m = mesh.transformMatrix.val;
      var tx = x * m[0] + y * m[4] + z * m[8] + m[12];
      var ty = x * m[1] + y * m[5] + z * m[9] + m[13];
      var tw = x * m[3] + y * m[7] + z * m[11] + m[15];
      if (Math.abs(tw) < 1e-8) tw = 1e-8;
      return {
        x: mesh.x + (tx / tw) * mesh.width,
        y: mesh.y - (ty / tw) * mesh.height,
        scale: Math.max(0.45, Math.min(1.35, 0.95 / Math.max(0.35, tw)))
      };
    }`,
  `function projectModel(x, y, z) {
      // y=elev, z=planeY → vertex (x, z, y)
      var mesh = current.phaser && current.phaser.terrain;
      if (!mesh || !mesh.transformMatrix) return { x: 0, y: 0, scale: 1 };
      try {
        if (typeof mesh.preUpdate === 'function') mesh.preUpdate();
      } catch (_) {}
      var m = mesh.transformMatrix.val;
      var vx = x, vy = z, vz = y;
      var tx = vx * m[0] + vy * m[4] + vz * m[8] + m[12];
      var ty = vx * m[1] + vy * m[5] + vz * m[9] + m[13];
      var tw = vx * m[3] + vy * m[7] + vz * m[11] + m[15];
      if (Math.abs(tw) < 1e-8) tw = 1e-8;
      return {
        x: mesh.x + (tx / tw) * mesh.width,
        y: mesh.y - (ty / tw) * mesh.height,
        scale: Math.max(0.45, Math.min(1.35, 0.95 / Math.max(0.35, tw)))
      };
    }`
);

// mesh init defaults
s = s.replace(
  `        if (typeof mesh.setPerspective === 'function') {
          mesh.setPerspective(w, h, 42, 1.0, 100);
        }
        if (mesh.viewPosition) {
          mesh.viewPosition.x = 0;
          mesh.viewPosition.y = 0.12;
          mesh.viewPosition.z = 5.2;
        }
        if (mesh.modelRotation) {
          mesh.modelRotation.x = phaserTiltRad(45);
          mesh.modelRotation.y = 0;
          mesh.modelRotation.z = 0;
        }
        if (mesh.modelScale) {
          mesh.modelScale.x = 2.15;
          mesh.modelScale.y = 2.15;
          mesh.modelScale.z = 2.15;
        }`,
  `        if (typeof mesh.setPerspective === 'function') {
          mesh.setPerspective(w, h, 45, 0.45, 80);
        }
        if (mesh.viewPosition) {
          mesh.viewPosition.x = 0;
          mesh.viewPosition.y = 0;
          mesh.viewPosition.z = 5.6;
        }
        if (mesh.modelRotation) {
          mesh.modelRotation.x = phaserTiltRad(48);
          mesh.modelRotation.y = 0;
          mesh.modelRotation.z = 0;
        }
        if (mesh.modelScale) {
          mesh.modelScale.x = 1.28;
          mesh.modelScale.y = 1.28;
          mesh.modelScale.z = 1.28;
        }`
);

s = s.replace(
  `        current.phaser.baseZ = 5.2;
        current.phaser.baseScale = 2.15;
        current.phaser.panX = 0;
        current.phaser.panZ = 0.04;
        camTilt = 45;
        camZoom = 1.0;`,
  `        current.phaser.baseZ = 5.6;
        current.phaser.baseScale = 1.28;
        current.phaser.panX = 0;
        current.phaser.panY = 0;
        camTilt = 48;
        camZoom = 1.0;`
);

// hitModel: plane Y is vertex.y
s = s.replace(
  `          return {
            x: v1.x * w + v2.x * v + v3.x * u,
            z: v1.z * w + v2.z * v + v3.z * u
          };`,
  `          return {
            x: v1.x * w + v2.x * v + v3.x * u,
            z: v1.y * w + v2.y * v + v3.y * u
          };`
);

// drag pan for XY
s = s.replace(
  `          var yaw = camYaw * Math.PI / 180;
          var zNow = phaserZoomClamp(camZoom);
          var s = (current.phaser.baseScale || 2.15) * zNow;
          var dist = Math.max(4.9, Math.min(6.6, (current.phaser.baseZ || 5.2) / Math.pow(zNow, 0.08)));
          var vh = Math.max(2, scene.scale.height);
          var k = (2 * Math.tan(21 * Math.PI / 180) * dist) / (vh * s);
          var kY = k / Math.max(0.5, Math.sin(phaserTiltRad(camTilt)));
          current.phaser.panX += Math.cos(yaw) * dx * k + Math.sin(yaw) * dy * kY;
          current.phaser.panZ += -Math.sin(yaw) * dx * k + Math.cos(yaw) * dy * kY;
          applyPhaserCam();
        });

        current.phaser.reset = function () {
          current.phaser.panX = 0;
          current.phaser.panZ = 0.04;
          camTilt = 45;
          camZoom = 1.0;
          camYaw = 0;
          applyCam();
          setStatus('Phaser 3D · ЛКМ перетаскивание · колесо — зум · Q/E — наклон');
        };`,
  `          var yaw = camYaw * Math.PI / 180;
          var zNow = phaserZoomClamp(camZoom);
          var sScale = current.phaser.baseScale || 1.28;
          var dist = Math.max(3.4, Math.min(10.5, (current.phaser.baseZ || 5.6) / zNow));
          var vh = Math.max(2, scene.scale.height);
          var k = (2 * Math.tan(22.5 * Math.PI / 180) * dist) / (vh * sScale);
          current.phaser.panX += Math.cos(yaw) * dx * k + Math.sin(yaw) * dy * k;
          current.phaser.panY += -Math.sin(yaw) * dx * k + Math.cos(yaw) * dy * k;
          applyPhaserCam();
        });

        current.phaser.reset = function () {
          current.phaser.panX = 0;
          current.phaser.panY = 0;
          camTilt = 48;
          camZoom = 1.0;
          camYaw = 0;
          applyCam();
          setStatus('Phaser 3D · ЛКМ перетаскивание · колесо — зум · Q/E — наклон');
        };`
);

s = s.replace(
  `      panX: 0,
      panZ: 0,
      baseZ: 5.2,
      baseScale: 2.15,
      syncProps: null
    };`,
  `      panX: 0,
      panY: 0,
      baseZ: 5.6,
      baseScale: 1.28,
      syncProps: null
    };`
);

// indices for CCW from +Z: a, b, cIdx
s = s.replace(
  `          inds.push(a, cIdx, b, b, cIdx, d);`,
  `          inds.push(a, b, cIdx, b, d, cIdx);`
);

fs.writeFileSync(path, s);
console.log('phaser XY rewrite done');
