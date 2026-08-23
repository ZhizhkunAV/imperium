/**
 * Click-to-move legionary for Babylon.js (view 11).
 * Click the soldier to select, then click the ground to walk.
 */
(function (global) {
  'use strict';

  function col(r, g, b) {
    return new BABYLON.Color3(r, g, b);
  }

  function std(scene, color, extra) {
    var m = new BABYLON.StandardMaterial('m' + Math.random().toString(36).slice(2), scene);
    m.diffuseColor = color;
    m.specularColor = extra && extra.spec ? extra.spec : col(0.12, 0.12, 0.1);
    if (extra && extra.em) m.emissiveColor = extra.em;
    return m;
  }

  function box(name, size, scene, mat, parent) {
    var m = BABYLON.MeshBuilder.CreateBox(name, size, scene);
    m.material = mat;
    if (parent) m.parent = parent;
    return m;
  }

  function buildBody(scene, scale) {
    var root = new BABYLON.TransformNode('soldier', scene);
    root.scaling.setAll(scale);

    var bronze = std(scene, col(0.54, 0.42, 0.22));
    var cloth = std(scene, col(0.55, 0.16, 0.13));
    var skin = std(scene, col(0.77, 0.63, 0.48));
    var leather = std(scene, col(0.29, 0.2, 0.12));
    var plume = std(scene, col(0.6, 0.12, 0.12));
    var wood = std(scene, col(0.42, 0.29, 0.16));

    var hips = new BABYLON.TransformNode('hips', scene);
    hips.parent = root;
    hips.position.y = 0.72;

    function limb(parent, name, x, y, z, w, h, d, mat) {
      var n = new BABYLON.TransformNode(name, scene);
      n.parent = parent;
      n.position.set(x, y, z);
      var mesh = box(name + 'm', { width: w, height: h, depth: d }, scene, mat, n);
      mesh.position.y = -h / 2;
      mesh.isPickable = true;
      return n;
    }

    var leftLeg = limb(hips, 'lleg', -0.11, 0, 0.02, 0.15, 0.4, 0.16, leather);
    var rightLeg = limb(hips, 'rleg', 0.11, 0, 0.02, 0.15, 0.4, 0.16, leather);
    limb(leftLeg, 'lshin', 0, -0.4, 0, 0.13, 0.36, 0.14, bronze);
    limb(rightLeg, 'rshin', 0, -0.4, 0, 0.13, 0.36, 0.14, bronze);

    var torso = box('torso', { width: 0.42, height: 0.52, depth: 0.24 }, scene, bronze, root);
    torso.position.y = 1.08;
    torso.isPickable = true;
    var skirt = box('skirt', { width: 0.46, height: 0.18, depth: 0.28 }, scene, cloth, root);
    skirt.position.y = 0.78;

    var leftArm = limb(root, 'larm', -0.28, 1.24, 0, 0.12, 0.42, 0.12, skin);
    var rightArm = limb(root, 'rarm', 0.28, 1.24, 0, 0.12, 0.42, 0.12, skin);
    var shield = box('shield', { width: 0.08, height: 0.42, depth: 0.28 }, scene, wood, leftArm);
    shield.position.set(-0.12, -0.2, 0.06);
    var spear = box('spear', { width: 0.045, height: 1.15, depth: 0.045 }, scene, bronze, rightArm);
    spear.position.set(0.02, -0.55, 0.04);

    var head = BABYLON.MeshBuilder.CreateSphere('head', { diameter: 0.28, segments: 10 }, scene);
    head.material = skin;
    head.parent = root;
    head.position.y = 1.44;
    head.isPickable = true;
    var crest = box('crest', { width: 0.06, height: 0.22, depth: 0.28 }, scene, plume, root);
    crest.position.y = 1.64;

    var ring = BABYLON.MeshBuilder.CreateTorus('sel', { diameter: 0.9, thickness: 0.06, tessellation: 24 }, scene);
    ring.material = std(scene, col(0.91, 0.78, 0.42), { em: col(0.35, 0.28, 0.08) });
    ring.parent = root;
    ring.position.y = 0.04;
    ring.isVisible = false;
    ring.isPickable = false;

    var hit = BABYLON.MeshBuilder.CreateCylinder('hit', { height: 1.8, diameter: 0.85 }, scene);
    hit.parent = root;
    hit.position.y = 0.9;
    hit.isVisible = false;
    hit.isPickable = true;
    hit.metadata = { walkHit: true };

    return { root: root, leftLeg: leftLeg, rightLeg: rightLeg, leftArm: leftArm, rightArm: rightArm, ring: ring, hit: hit };
  }

  function mount(opts) {
    var scene = opts.scene;
    var camera = opts.camera;
    var ground = opts.ground;
    var hover = opts.hover == null ? 0.5 : opts.hover;
    var speed = opts.speed || 5.5;
    var scale = opts.scale || 1;
    var canvas = opts.canvas;
    var getHeight = opts.getHeight || function () { return 0; };
    var onStatus = opts.onStatus || function () {};
    var follow = opts.follow || null;
    var isPanning = opts.isPanning || function () { return false; };

    var parts = buildBody(scene, scale);
    var root = parts.root;
    var start = opts.start || { x: 0, z: 0 };
    root.position.x = start.x;
    root.position.z = start.z;
    root.position.y = getHeight(start.x, start.z) + hover;

    var selected = false;
    var walking = false;
    var goal = null;
    var walkT = 0;
    var pointer = { down: false, x: 0, y: 0, moved: false, onUnit: false };
    var panLock = false;

    function groundY(x, z) {
      var origin = new BABYLON.Vector3(x, 80, z);
      var dir = new BABYLON.Vector3(0, -1, 0);
      var ray = new BABYLON.Ray(origin, dir, 120);
      var hit = scene.pickWithRay(ray, function (m) { return m === ground; });
      if (hit && hit.hit && hit.pickedPoint) return hit.pickedPoint.y;
      return getHeight(x, z);
    }

    function setSelected(on) {
      selected = !!on;
      parts.ring.isVisible = selected;
      onStatus(selected
        ? 'Солдат выбран · клик по карте — идти'
        : 'Кликните солдата, затем точку на карте');
    }

    function pickAt(px, py) {
      return scene.pick(px, py);
    }

    function isUnitMesh(mesh) {
      if (!mesh) return false;
      var n = mesh;
      while (n) {
        if (n === root || n === parts.hit) return true;
        n = n.parent;
      }
      return false;
    }

    function onDown(e) {
      if (e.button !== 0) return;
      pointer.down = true;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.moved = false;
      var pick = pickAt(scene.pointerX, scene.pointerY);
      pointer.onUnit = !!(pick && pick.hit && isUnitMesh(pick.pickedMesh));
      if (pointer.onUnit) {
        setSelected(true);
        panLock = true;
        if (camera.detachControl) camera.detachControl(canvas);
        e.stopPropagation();
      }
    }

    function onMove(e) {
      if (!pointer.down) return;
      var dx = e.clientX - pointer.x, dy = e.clientY - pointer.y;
      if (dx * dx + dy * dy > 36) {
        pointer.moved = true;
        if (!pointer.onUnit && panLock) {
          panLock = false;
          if (camera.attachControl) camera.attachControl(canvas, true);
        }
      }
    }

    function onUp() {
      if (!pointer.down) return;
      pointer.down = false;
      if (panLock) {
        panLock = false;
        if (camera.attachControl) camera.attachControl(canvas, true);
      }
      if (pointer.moved || pointer.onUnit || !selected) return;
      var pick = pickAt(scene.pointerX, scene.pointerY);
      if (!pick || !pick.hit || !pick.pickedPoint) return;
      if (isUnitMesh(pick.pickedMesh)) return;
      goal = { x: pick.pickedPoint.x, z: pick.pickedPoint.z };
      walking = true;
      onStatus('Солдат идёт…');
    }

    canvas.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);

    var obs = scene.onBeforeRenderObservable.add(function () {
      var dt = Math.min(0.05, scene.getEngine().getDeltaTime() / 1000);
      if (walking && goal) {
        var dx = goal.x - root.position.x;
        var dz = goal.z - root.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        var step = speed * dt;
        if (dist <= step || dist < 0.12) {
          root.position.x = goal.x;
          root.position.z = goal.z;
          walking = false;
          goal = null;
          walkT = 0;
          parts.leftLeg.rotation.x = 0;
          parts.rightLeg.rotation.x = 0;
          parts.leftArm.rotation.x = 0;
          parts.rightArm.rotation.x = 0;
          onStatus('Солдат на месте · клик по карте — новый приказ');
        } else {
          root.position.x += dx / dist * step;
          root.position.z += dz / dist * step;
          root.rotation.y = Math.atan2(dx, dz);
          walkT += dt * 8;
          var swing = Math.sin(walkT) * (15 * Math.PI / 180);
          parts.leftLeg.rotation.x = swing;
          parts.rightLeg.rotation.x = -swing;
          parts.leftArm.rotation.x = -swing * 0.85;
          parts.rightArm.rotation.x = swing * 0.85;
        }
      }
      root.position.y = groundY(root.position.x, root.position.z) + hover;
      if (parts.ring.isVisible) parts.ring.rotation.y += dt * 1.4;
      if (walking && follow && !isPanning()) {
        follow(root.position.x, root.position.y + 1.1 * scale, root.position.z);
      }
    });

    function dispose() {
      scene.onBeforeRenderObservable.remove(obs);
      canvas.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      root.dispose();
    }

    onStatus('Кликните солдата, затем точку на карте');
    return { root: root, dispose: dispose, isWalking: function () { return walking; } };
  }

  global.WalkUnitBabylon = { mount: mount };
})(typeof window !== 'undefined' ? window : this);
