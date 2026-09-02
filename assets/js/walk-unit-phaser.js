/**
 * Click-to-move legionary sprites for Phaser (view 12).
 * mount — один солдат; mountPair — Рим (красный) vs Карфаген (белый) + контактный бой.
 */
(function (global) {
  'use strict';

  function makeSheet(style) {
    var fw = 64, fh = 80, frames = 4;
    var c = document.createElement('canvas');
    c.width = fw * frames;
    c.height = fh;
    var g = c.getContext('2d');
    var white = style === 'white';
    var cloth = white ? '#f0ece4' : '#8a2a22';
    var bronze = white ? '#e0ddd4' : '#8a6a38';
    var leather = white ? '#c8c4bc' : '#4a3220';
    var plume = white ? '#f8f6f0' : '#9a2020';
    var poses = [
      { l: 12, r: -10, la: -8, ra: 10 },
      { l: 0, r: 0, la: 0, ra: 0 },
      { l: -12, r: 10, la: 10, ra: -8 },
      { l: 0, r: 0, la: 0, ra: 0 }
    ];
    function limb(cx, cy, ang, len, w, color) {
      g.save();
      g.translate(cx, cy);
      g.rotate(ang * Math.PI / 180);
      g.fillStyle = color;
      g.fillRect(-w / 2, 0, w, len);
      g.restore();
    }
    for (var i = 0; i < frames; i++) {
      var ox = i * fw + fw / 2;
      var p = poses[i];
      g.fillStyle = 'rgba(0,0,0,0.22)';
      g.beginPath();
      g.ellipse(ox, 72, 11, 4, 0, 0, Math.PI * 2);
      g.fill();
      limb(ox - 5, 42, p.l, 22, 6, leather);
      limb(ox + 5, 42, p.r, 22, 6, leather);
      g.fillStyle = cloth;
      g.fillRect(ox - 8, 34, 16, 14);
      g.fillStyle = bronze;
      g.fillRect(ox - 9, 22, 18, 16);
      limb(ox - 10, 24, -70 + p.la, 16, 5, '#c4a07a');
      limb(ox + 10, 24, 70 + p.ra, 16, 5, '#c4a07a');
      g.fillStyle = leather;
      g.fillRect(ox - 18, 26, 7, 16);
      g.fillStyle = '#c4a07a';
      g.beginPath();
      g.arc(ox, 16, 7, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = bronze;
      g.beginPath();
      g.arc(ox, 14, 8, Math.PI, Math.PI * 2);
      g.fill();
      g.fillStyle = plume;
      g.fillRect(ox - 2, 4, 4, 8);
    }
    return c;
  }

  function ensureAnims(scene, texKey, walkKey, idleKey) {
    if (!scene.anims.exists(walkKey)) {
      scene.anims.create({
        key: walkKey,
        frames: [
          { key: texKey, frame: '0' },
          { key: texKey, frame: '1' },
          { key: texKey, frame: '2' },
          { key: texKey, frame: '3' }
        ],
        frameRate: 8,
        repeat: -1
      });
    }
    if (!scene.anims.exists(idleKey)) {
      scene.anims.create({
        key: idleKey,
        frames: [{ key: texKey, frame: '1' }],
        frameRate: 1
      });
    }
  }

  function mount(opts) {
    var scene = opts.scene;
    var start = opts.start || { x: 0, z: 0 };
    var speed = opts.speed != null ? opts.speed : 0.42;
    var onStatus = opts.onStatus || function () {};
    var project = opts.project;
    var getModelY = opts.getModelY || function () { return 0; };
    var style = opts.style || 'rome';
    var selectable = opts.selectable !== false;
    var ringColor = opts.ringColor != null ? opts.ringColor : (style === 'white' ? 0xb0b8c4 : 0xe8c86a);
    var is3d = typeof project === 'function';
    var model = {
      x: is3d ? (start.x || 0) : 0,
      z: is3d ? (start.z != null ? start.z : start.y || 0) : 0
    };
    var texKey = style === 'white' ? 'walk-soldier-white' : 'walk-soldier';
    var walkKey = style === 'white' ? 'walk-white' : 'walk';
    var idleKey = style === 'white' ? 'idle-white' : 'idle';

    if (!scene.textures.exists(texKey)) {
      var sheet = makeSheet(style);
      var tex = scene.textures.addCanvas(texKey, sheet);
      for (var fi = 0; fi < 4; fi++) tex.add(String(fi), 0, fi * 64, 0, 64, 80);
    }
    ensureAnims(scene, texKey, walkKey, idleKey);

    var sprite = scene.add.sprite(0, 0, texKey, '1');
    sprite.setOrigin(0.5, 0.92);
    sprite.setScale(1.58);
    sprite.setDepth(style === 'white' ? 19 : 20);
    if (selectable) sprite.setInteractive({ useHandCursor: true });

    var ring = scene.add.ellipse(0, 0, 50, 20, ringColor, 0.0);
    ring.setStrokeStyle(2, ringColor, 0.95);
    ring.setDepth(18);
    ring.setVisible(false);

    var selected = false;
    var tween = null;
    var armyId = opts.armyId || null;
    var pendingMeta = null;

    var root = {
      position: {
        get x() { return model.x; },
        set x(v) { model.x = v; },
        get y() { return getModelY(model.x, model.z); },
        set y(v) { /* height from DEM */ },
        get z() { return model.z; },
        set z(v) { model.z = v; },
        set: function (x, y, z) {
          model.x = x;
          if (z != null) model.z = z;
          place();
        }
      },
      visible: true
    };

    function place() {
      if (!root.visible) {
        sprite.setVisible(false);
        ring.setVisible(false);
        return;
      }
      sprite.setVisible(true);
      if (is3d) {
        var y = getModelY(model.x, model.z);
        var p = project(model.x, y, model.z);
        if (p) {
          sprite.setPosition(p.x, p.y);
          var sc = 1.58 + Math.min(0.55, y * 0.55);
          if (p.scale) sc *= p.scale;
          sprite.setScale(sc);
        }
      }
      ring.setPosition(sprite.x, sprite.y + 8);
      if (selected) ring.setVisible(true);
    }

    function setSelected(on) {
      if (!selectable) return;
      selected = !!on;
      ring.setVisible(selected);
      onStatus(selected
        ? 'Рим выбран · клик по карте — идти · клик по белому — атака'
        : 'Кликните красного солдата, затем точку или врага');
      if (opts.onSelect) opts.onSelect(selected);
    }

    function stopWalk() {
      if (tween) { tween.stop(); tween = null; }
      sprite.anims.play(idleKey, true);
      pendingMeta = null;
    }

    function moveTo(x, z, meta) {
      if (!(speed > 0)) return;
      var dx = x - model.x, dz = z - model.z;
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.012) {
        if (meta && meta.combat && opts.onArrive) opts.onArrive(meta);
        return;
      }
      stopWalk();
      pendingMeta = meta || null;
      sprite.setFlipX(dx < 0);
      sprite.anims.play(walkKey, true);
      tween = scene.tweens.add({
        targets: model,
        x: x,
        z: z,
        duration: Math.max(280, dist / Math.max(0.05, speed) * 1000),
        ease: 'Linear',
        onUpdate: place,
        onComplete: function () {
          tween = null;
          sprite.anims.play(idleKey, true);
          place();
          var m = pendingMeta;
          pendingMeta = null;
          if (m && m.combat) {
            onStatus('Контакт с врагом!');
            if (opts.onArrive) opts.onArrive(m);
          } else {
            onStatus('Солдат на месте · клик по карте — новый приказ');
            if (opts.onArrive) opts.onArrive(m || {});
          }
        }
      });
      onStatus(meta && meta.combat ? 'Рим атакует…' : 'Солдат идёт…');
    }

    if (selectable) {
      sprite.on('pointerdown', function (pointer) {
        if (pointer && pointer.event) {
          try { pointer.event.stopPropagation(); } catch (_) {}
        }
        setSelected(true);
        scene._walkIgnoreClick = true;
      });
    }

    scene.events.on('update', function () {
      place();
    });

    place();
    return {
      sprite: sprite,
      root: root,
      model: model,
      style: style,
      isSelected: function () { return selected; },
      moveTo: moveTo,
      setSelected: setSelected,
      sync: place,
      stopWalk: stopWalk,
      isWalking: function () { return !!tween; },
      getArmyId: function () { return armyId; },
      setArmyId: function (id) { armyId = id; },
      containsPointer: function (pointer) {
        try {
          var hits = scene.input.hitTestPointer(pointer);
          return hits && hits.indexOf(sprite) !== -1;
        } catch (_) {
          return false;
        }
      }
    };
  }

  function mountPair(opts) {
    var stop = opts.combatStop != null ? opts.combatStop : 0.22;
    var lastNpcClick = 0;
    var npc = mount({
      scene: opts.scene,
      start: opts.npcStart,
      speed: 0,
      style: 'white',
      selectable: false,
      project: opts.project,
      getModelY: opts.getModelY,
      armyId: opts.npcArmyId || 'field_carthage_1',
      onStatus: function () {}
    });
    if (npc.sprite && !npc.sprite.input) {
      npc.sprite.setInteractive({ useHandCursor: true });
    }

    var player;
    player = mount({
      scene: opts.scene,
      start: opts.playerStart,
      speed: opts.speed != null ? opts.speed : 0.42,
      style: 'rome',
      selectable: true,
      ringColor: opts.ringColor != null ? opts.ringColor : 0x3a8cff,
      project: opts.project,
      getModelY: opts.getModelY,
      armyId: opts.armyId || 'field_rome_1',
      onStatus: opts.onStatus,
      onSelect: opts.onSelect,
      onArrive: function (meta) {
        if (meta && meta.combat) {
          if (opts.onBattle) opts.onBattle();
          else if (global.BattleSystem) BattleSystem.showBattleDialog();
        }
        if (opts.onArrive) opts.onArrive(meta, player);
      }
    });

    function attackNpc() {
      var px = player.model.x, pz = player.model.z;
      var nx = npc.model.x, nz = npc.model.z;
      var dx = nx - px, dz = nz - pz;
      var len = Math.sqrt(dx * dx + dz * dz) || 1;
      var tx = nx - dx / len * stop;
      var tz = nz - dz / len * stop;
      player.setSelected(true);
      player.moveTo(tx, tz, { combat: true });
    }

    npc.sprite.on('pointerdown', function (pointer) {
      if (pointer && pointer.event) {
        try { pointer.event.stopPropagation(); } catch (_) {}
      }
      var now = Date.now();
      if (now - lastNpcClick < 420) {
        lastNpcClick = 0;
        if (opts.onNpcInspect) opts.onNpcInspect();
        else if (global.BattleSystem && BattleSystem.inspectCarthageArmy) BattleSystem.inspectCarthageArmy();
        opts.scene._walkIgnoreClick = true;
        opts.scene._cityClickHandled = true;
        return;
      }
      lastNpcClick = now;
      if (player.isSelected()) {
        attackNpc();
      } else {
        if (opts.onStatus) opts.onStatus('Армия Карфагена · выберите римлянина, затем клик по белому — атака · двойной клик — состав');
      }
      opts.scene._walkIgnoreClick = true;
      opts.scene._cityClickHandled = true;
    });

    return {
      player: player,
      npc: npc,
      attackNpc: attackNpc,
      sync: function () {
        player.sync();
        npc.sync();
      },
      dispose: function () {
        try { player.stopWalk(); npc.stopWalk(); } catch (_) {}
      }
    };
  }

  global.WalkUnitPhaser = { mount: mount, mountPair: mountPair };
})(typeof window !== 'undefined' ? window : this);
