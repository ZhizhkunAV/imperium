const fs = require('fs');
const path = 'C:/Users/Пользователь/Desktop/AI/my-website/assets/maps/view10/map.html';
let s = fs.readFileSync(path, 'utf8');

// Replace applyPhaserCam framing to simple distance+scale (no setViewHeight)
const oldLoop = `      var z = phaserZoomClamp(camZoom);
      var sScale = pack.baseScale || 1.55;
      var rotX = phaserTiltRad(camTilt);
      var mapExtent = pack.mapExtent || 4;
      var panLim = 1.35 / Math.max(0.85, sScale);
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
        if (typeof mesh.setPerspective === 'function') mesh.setPerspective(w, h, 45, 0.4, 100);
        if (mesh.modelScale) {
          mesh.modelScale.x = sScale;
          mesh.modelScale.y = sScale;
          mesh.modelScale.z = sScale;
        }
        if (typeof mesh.setViewHeight === 'function') {
          // больше frameH = камера дальше = карта целиком в кадре
          mesh.setViewHeight(mapExtent * sScale * 1.08 / z);
        } else if (mesh.viewPosition) {
          mesh.viewPosition.z = Math.max(3.2, Math.min(12, (pack.baseZ || 5.4) / z));
        }
        if (mesh.viewPosition) {
          mesh.viewPosition.x = 0;
          mesh.viewPosition.y = Math.sin(rotX) * mapExtent * sScale * 0.15;
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
        mesh.ignoreDirtyCache = true;
        if (typeof mesh.preUpdate === 'function') mesh.preUpdate();
        mesh.ignoreDirtyCache = false;
      }`;

const newLoop = `      var z = phaserZoomClamp(camZoom);
      var sScale = pack.baseScale || 1.85;
      var rotX = phaserTiltRad(camTilt);
      var dist = Math.max(3.8, Math.min(11, (pack.baseZ || 6.2) / z));
      var panLim = 1.4 / Math.max(0.85, sScale);
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
        if (typeof mesh.setPerspective === 'function') mesh.setPerspective(w, h, 48, 0.5, 60);
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
      }`;

if (!s.includes('setViewHeight')) {
  console.log('setViewHeight already gone, skip cam loop');
} else {
  if (!s.includes(oldLoop.slice(0, 60))) {
    console.error('old loop not found');
    process.exit(1);
  }
  s = s.replace(oldLoop, newLoop);
}

// Flat-ish mesh: low elevation, solid plane fill
const elev = `function elevY(m, lat, lon) {
      if (!(m > 6)) return -0.01;
      var t = Math.min(1, Math.max(0, m / 3200));
      return 0.008 + Math.pow(t, 1.15) * 0.22;
    }`;
const elev2 = `function elevY(m, lat, lon) {
      if (!(m > 6)) return 0;
      var t = Math.min(1, Math.max(0, m / 3000));
      return 0.01 + Math.pow(t, 1.1) * 0.35;
    }`;
s = s.replace(elev, elev2);

s = s.replace(
  `        current.phaser.baseZ = 5.4;
        current.phaser.baseScale = 1.55;`,
  `        current.phaser.baseZ = 6.2;
        current.phaser.baseScale = 1.85;`
);
s = s.replace(
  `      baseZ: 5.4,
      baseScale: 1.55,`,
  `      baseZ: 6.2,
      baseScale: 1.85,`
);
s = s.replace(
  `          mesh.modelScale.x = 1.55;
          mesh.modelScale.y = 1.55;
          mesh.modelScale.z = 1.55;`,
  `          mesh.modelScale.x = 1.85;
          mesh.modelScale.y = 1.85;
          mesh.modelScale.z = 1.85;`
);
s = s.replace(`mesh.viewPosition.z = 5.4;`, `mesh.viewPosition.z = 6.2;`);

// tilt: more visible 3D
s = s.replace(
  `return 0.42 - ((t - 10) / (TILT_MAX - 10)) * 0.30; // ~0.42…0.12`,
  `return 0.55 - ((t - 10) / (TILT_MAX - 10)) * 0.40; // ~0.55…0.15`
);

fs.writeFileSync(path, s);
console.log('simplified framing ok');
