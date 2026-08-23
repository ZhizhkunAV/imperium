/**
 * Click-to-move legionary for Three.js maps (views 10 and 14).
 * LMB on soldier — select. RMB on ground — move (when selected).
 * LMB drag still pans the map.
 */
(function (global) {
  'use strict';

  function mat(THREE, color, extras) {
    extras = extras || {};
    return new THREE.MeshPhongMaterial({
      color: color,
      shininess: extras.shininess != null ? extras.shininess : 18,
      specular: extras.specular || 0x222222
    });
  }

  function box(THREE, w, h, d, material) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function limb(THREE, parent, ox, oy, oz, w, h, d, material, pivotY) {
    var g = new THREE.Group();
    g.position.set(ox, oy, oz);
    var mesh = box(THREE, w, h, d, material);
    mesh.position.y = pivotY != null ? pivotY : -h / 2;
    g.add(mesh);
    parent.add(g);
    return g;
  }

  function paletteOf(style) {
    if (style === 'white') {
      return {
        bronze: 0xe8e6df,
        cloth: 0xf4f1ea,
        skin: 0xe8d4c0,
        leather: 0xc8c4bc,
        plume: 0xffffff,
        wood: 0xdedad2,
        ring: 0xb0b8c4
      };
    }
    return {
      bronze: 0x8a6a38,
      cloth: 0x8b2a22,
      skin: 0xc4a07a,
      leather: 0x4a3220,
      plume: 0x9a2020,
      wood: 0x6a4a28,
      ring: 0xe8c86a
    };
  }

  function buildBody(THREE, scale, style) {
    var pal = paletteOf(style);
    var root = new THREE.Group();
    root.scale.setScalar(scale);
    var bronze = mat(THREE, pal.bronze, { shininess: 40, specular: 0x554422 });
    var cloth = mat(THREE, pal.cloth);
    var skin = mat(THREE, pal.skin);
    var leather = mat(THREE, pal.leather);
    var plume = mat(THREE, pal.plume, { shininess: 8 });
    var wood = mat(THREE, pal.wood);

    var hips = new THREE.Group();
    hips.position.y = 0.72;
    root.add(hips);

    var leftLeg = limb(THREE, hips, -0.11, 0, 0.02, 0.15, 0.4, 0.16, leather);
    var rightLeg = limb(THREE, hips, 0.11, 0, 0.02, 0.15, 0.4, 0.16, leather);
    var leftShin = limb(THREE, leftLeg, 0, -0.4, 0, 0.13, 0.36, 0.14, bronze);
    var rightShin = limb(THREE, rightLeg, 0, -0.4, 0, 0.13, 0.36, 0.14, bronze);
    var bootL = box(THREE, 0.16, 0.08, 0.22, leather);
    bootL.position.set(0, -0.36, 0.04);
    leftShin.add(bootL);
    var bootR = box(THREE, 0.16, 0.08, 0.22, leather);
    bootR.position.set(0, -0.36, 0.04);
    rightShin.add(bootR);

    var torso = box(THREE, 0.42, 0.52, 0.24, bronze);
    torso.position.y = 1.08;
    root.add(torso);
    var skirt = box(THREE, 0.46, 0.18, 0.28, cloth);
    skirt.position.y = 0.78;
    root.add(skirt);

    var leftArm = limb(THREE, root, -0.28, 1.24, 0, 0.12, 0.42, 0.12, skin, -0.18);
    var rightArm = limb(THREE, root, 0.28, 1.24, 0, 0.12, 0.42, 0.12, skin, -0.18);
    var shield = box(THREE, 0.08, 0.42, 0.28, wood);
    shield.position.set(-0.12, -0.2, 0.06);
    leftArm.add(shield);
    var spear = box(THREE, 0.045, 1.15, 0.045, bronze);
    spear.position.set(0.02, -0.55, 0.04);
    rightArm.add(spear);

    var head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), skin);
    head.position.y = 1.44;
    head.castShadow = true;
    root.add(head);
    var helm = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), bronze);
    helm.position.y = 1.48;
    root.add(helm);
    var crest = box(THREE, 0.06, 0.22, 0.28, plume);
    crest.position.y = 1.64;
    root.add(crest);

    var ring = new THREE.Mesh(
      new THREE.RingGeometry(0.38, 0.5, 24),
      new THREE.MeshBasicMaterial({ color: pal.ring, transparent: true, opacity: 0.92, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    ring.visible = false;
    root.add(ring);

    var hit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.72, 1.8, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.y = 0.88;
    hit.userData.walkHit = true;
    root.add(hit);

    root.userData.walkUnit = true;
    return {
      root: root,
      leftLeg: leftLeg,
      rightLeg: rightLeg,
      leftArm: leftArm,
      rightArm: rightArm,
      ring: ring,
      hit: hit
    };
  }

  function mount(opts) {
    var THREE = opts.THREE;
    var scene = opts.scene;
    var camera = opts.camera;
    var canvas = opts.canvas;
    var land = opts.land || null;
    var hover = opts.hover == null ? 0.5 : opts.hover;
    var speed = opts.speed || 7;
    var scale = opts.scale || 1;
    var follow = opts.follow || null;
    var isPanning = opts.isPanning || function () { return false; };
    var setPanEnabled = opts.setPanEnabled || function () {};
    var getHeight = opts.getHeight || function () { return 0; };
    var onStatus = opts.onStatus || function () {};
    var onArrive = opts.onArrive || function () {};
    var pickTarget = opts.pickTarget || null;
    var manageInput = opts.manageInput !== false;
    var selectable = opts.selectable !== false;
    var canWalk = opts.canWalk || function () { return true; };
    var onMapClick = opts.onMapClick || null;

    function walkBlock(x, z) {
      var r = canWalk(x, z);
      if (r === true || r == null) return null;
      if (r === false) return 'Сюда нельзя: вода или высокие горы';
      return String(r);
    }

    function lastWalkableToward(x0, z0, x1, z1) {
      var dx = x1 - x0, dz = z1 - z0;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.04) return walkBlock(x1, z1) ? null : { x: x1, z: z1 };
      var steps = Math.max(6, Math.ceil(dist / 0.32));
      var last = { x: x0, z: z0 };
      var i, x, z;
      for (i = 1; i <= steps; i++) {
        x = x0 + dx * (i / steps);
        z = z0 + dz * (i / steps);
        if (walkBlock(x, z)) return i === 1 ? null : last;
        last = { x: x, z: z };
      }
      return last;
    }

    var parts = buildBody(THREE, scale, opts.style);
    if (opts.ringColor != null) parts.ring.material.color.setHex(opts.ringColor);
    var root = parts.root;
    var start = opts.start || { x: 0, z: 0 };
    root.position.set(start.x, getHeight(start.x, start.z) + hover, start.z);
    scene.add(root);

    var raycaster = new THREE.Raycaster();
    var ndc = new THREE.Vector2();
    var down = new THREE.Vector3(0, -1, 0);
    var from = new THREE.Vector3();
    var selected = false;
    var walking = false;
    var goal = null;
    var arriveMeta = null;
    var walkT = 0;
    var pointer = { down: false, rmb: false, x: 0, y: 0, moved: false, onUnit: false };

    function groundY(x, z) {
      if (land) {
        from.set(x, 220, z);
        raycaster.set(from, down);
        var hits = raycaster.intersectObject(land, false);
        if (hits && hits.length) return hits[0].point.y;
      }
      return getHeight(x, z);
    }

    function setSelected(on) {
      if (!selectable && on) return;
      var was = selected;
      selected = !!on;
      parts.ring.visible = selected;
      onStatus(selected
        ? 'Армия выбрана · ПКМ по карте — идти'
        : 'ЛКМ по солдату — выбрать армию');
      if (selected !== was && opts.onSelect) opts.onSelect(selected);
    }

    function pointerToNdc(e) {
      var rect = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function pickUnit(e) {
      pointerToNdc(e);
      raycaster.setFromCamera(ndc, camera);
      var hits = raycaster.intersectObject(root, true);
      return hits && hits.length > 0;
    }

    function pickGround(e) {
      pointerToNdc(e);
      raycaster.setFromCamera(ndc, camera);
      if (land) {
        var hits = raycaster.intersectObject(land, false);
        if (hits && hits.length) return hits[0].point;
      }
      raycaster.setFromCamera(ndc, camera);
      var plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      var pt = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, pt)) return pt;
      return null;
    }

    function moveTo(x, z, meta) {
      var block = walkBlock(x, z);
      if (block) {
        onStatus(block);
        return false;
      }
      var clipped = lastWalkableToward(root.position.x, root.position.z, x, z);
      if (!clipped) {
        onStatus('Путь закрыт: вода или высокие горы');
        return false;
      }
      goal = clipped;
      arriveMeta = (Math.abs(clipped.x - x) < 0.45 && Math.abs(clipped.z - z) < 0.45) ? (meta || null) : null;
      walking = true;
      return true;
    }

    function onDown(e) {
      if (e.button === 2) {
        pointer.rmb = true;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.moved = false;
        return;
      }
      if (e.button !== 0) return;
      pointer.down = true;
      pointer.rmb = false;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.moved = false;
      pointer.onUnit = pickUnit(e);
      if (pointer.onUnit) {
        if (selectable) setSelected(true);
        setPanEnabled(false);
        e.stopPropagation();
      }
    }

    function onMove(e) {
      if (!pointer.down && !pointer.rmb) return;
      var dx = e.clientX - pointer.x, dy = e.clientY - pointer.y;
      if (dx * dx + dy * dy > 36) {
        pointer.moved = true;
        if (pointer.down && !pointer.onUnit) setPanEnabled(true);
      }
    }

    function issueMove(e) {
      if (opts.beforeRmbMove && opts.beforeRmbMove(e)) return true;
      if (!selected) return false;
      if (pickTarget) {
        var tgt = pickTarget(e);
        if (tgt) {
          if (moveTo(tgt.x, tgt.z, tgt)) onStatus(tgt.combat ? 'Армия идёт к противнику…' : 'Армия идёт…');
          return true;
        }
      }
      var pt = pickGround(e);
      if (!pt) return false;
      var meta = null;
      if (opts.resolveEnterCity) {
        var cityName = opts.resolveEnterCity(e, pt);
        if (cityName) meta = { enterCity: cityName };
      }
      if (moveTo(pt.x, pt.z, meta)) {
        onStatus(meta ? 'Армия идёт в город…' : 'Армия идёт…');
      }
      return true;
    }

    function onUp(e) {
      if (e.button === 2 || pointer.rmb) {
        pointer.rmb = false;
        if (!pointer.moved) issueMove(e);
        return;
      }
      if (!pointer.down) return;
      pointer.down = false;
      setPanEnabled(true);
      if (pointer.moved) return;
      if (pointer.onUnit) return;
      // ЛКМ по карте больше не двигает армию
    }

    if (manageInput) {
      canvas.addEventListener('pointerdown', onDown, true);
      window.addEventListener('pointermove', onMove, true);
      window.addEventListener('pointerup', onUp, true);
      canvas.addEventListener('contextmenu', function (e) {
        e.preventDefault();
      });
    }

    function tick(dt) {
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
          var meta = arriveMeta;
          arriveMeta = null;
          onStatus('Армия на месте · ПКМ по карте — новый приказ');
          onArrive(meta);
        } else {
          var nx = root.position.x + dx / dist * step;
          var nz = root.position.z + dz / dist * step;
          if (walkBlock(nx, nz)) {
            walking = false;
            goal = null;
            walkT = 0;
            parts.leftLeg.rotation.x = 0;
            parts.rightLeg.rotation.x = 0;
            parts.leftArm.rotation.x = 0;
            parts.rightArm.rotation.x = 0;
            arriveMeta = null;
            onStatus('Путь закрыт: вода или высокие горы');
          } else {
            root.position.x = nx;
            root.position.z = nz;
            root.rotation.y = Math.atan2(dx, dz);
            walkT += dt * 8;
            var swing = Math.sin(walkT) * (15 * Math.PI / 180);
            parts.leftLeg.rotation.x = swing;
            parts.rightLeg.rotation.x = -swing;
            parts.leftArm.rotation.x = -swing * 0.85;
            parts.rightArm.rotation.x = swing * 0.85;
          }
        }
      }
      root.position.y = groundY(root.position.x, root.position.z) + hover;
      if (parts.ring.visible) parts.ring.rotation.z += dt * 1.4;
      if (walking && follow && !(pointer.down && pointer.moved)) {
        follow(root.position.x, root.position.y + 1.1 * scale, root.position.z, true);
      }
    }

    function dispose() {
      if (manageInput) {
        canvas.removeEventListener('pointerdown', onDown, true);
        window.removeEventListener('pointermove', onMove, true);
        window.removeEventListener('pointerup', onUp, true);
      }
      scene.remove(root);
    }

    if (selectable) onStatus('ЛКМ по солдату — выбрать · ПКМ — идти');
    return {
      root: root,
      tick: tick,
      moveTo: moveTo,
      setSelected: setSelected,
      dispose: dispose,
      pick: pickUnit,
      pickGround: pickGround,
      issueMove: issueMove,
      isSelected: function () { return selected; },
      isWalking: function () { return walking; },
      getArmyId: function () { return opts.armyId || null; },
      setArmyId: function (id) { opts.armyId = id; }
    };
  }

  function mountPair(opts) {
    var stop = opts.combatStop != null ? opts.combatStop : 2.0;
    var npc = mount({
      THREE: opts.THREE,
      scene: opts.scene,
      camera: opts.camera,
      canvas: opts.canvas,
      land: opts.land,
      hover: opts.hover,
      scale: opts.scale,
      speed: 0,
      style: 'white',
      selectable: false,
      manageInput: false,
      start: opts.npcStart,
      getHeight: opts.getHeight,
      onStatus: function () {}
    });
    var player;
    player = mount({
      THREE: opts.THREE,
      scene: opts.scene,
      camera: opts.camera,
      canvas: opts.canvas,
      land: opts.land,
      hover: opts.hover,
      scale: opts.scale,
      speed: opts.speed,
      style: 'rome',
      ringColor: opts.ringColor != null ? opts.ringColor : 0x3a8cff,
      start: opts.playerStart,
      getHeight: opts.getHeight,
      canWalk: opts.canWalk,
      follow: opts.follow,
      setPanEnabled: opts.setPanEnabled,
      onStatus: opts.onStatus,
      onMapClick: opts.onMapClick,
      onSelect: opts.onSelect,
      beforeRmbMove: opts.beforeRmbMove,
      armyId: opts.armyId,
      resolveEnterCity: opts.resolveEnterCity,
      onArrive: function (meta) {
        if (meta && meta.combat && opts.onBattle) opts.onBattle();
        if (opts.onArrive) opts.onArrive(meta, player);
      },
      pickTarget: function (e) {
        if (!npc.pick(e)) return null;
        var p = npc.root.position;
        var q = player.root.position;
        var dx = p.x - q.x, dz = p.z - q.z;
        var len = Math.sqrt(dx * dx + dz * dz) || 1;
        return { x: p.x - dx / len * stop, z: p.z - dz / len * stop, combat: true };
      }
    });
    return {
      player: player,
      npc: npc,
      tick: function (dt) {
        player.tick(dt);
        npc.tick(dt);
      },
      dispose: function () {
        player.dispose();
        npc.dispose();
      }
    };
  }

  global.WalkUnitThree = { mount: mount, mountPair: mountPair };
})(typeof window !== 'undefined' ? window : this);
