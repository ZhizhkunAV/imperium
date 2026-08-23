/**
 * Click-to-move legionary sprite for Phaser (view 12).
 * Click the soldier to select, then click the map to walk.
 * Optional project() places the sprite on a 3D Mesh heightfield.
 */
(function (global) {
  'use strict';

  function makeSheet() {
    var fw = 64, fh = 80, frames = 4;
    var c = document.createElement('canvas');
    c.width = fw * frames;
    c.height = fh;
    var g = c.getContext('2d');
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
      limb(ox - 5, 42, p.l, 22, 6, '#4a3220');
      limb(ox + 5, 42, p.r, 22, 6, '#4a3220');
      g.fillStyle = '#8a2a22';
      g.fillRect(ox - 8, 34, 16, 14);
      g.fillStyle = '#8a6a38';
      g.fillRect(ox - 9, 22, 18, 16);
      limb(ox - 10, 24, -70 + p.la, 16, 5, '#c4a07a');
      limb(ox + 10, 24, 70 + p.ra, 16, 5, '#c4a07a');
      g.fillStyle = '#6a4a28';
      g.fillRect(ox - 18, 26, 7, 16);
      g.fillStyle = '#c4a07a';
      g.beginPath();
      g.arc(ox, 16, 7, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#8a6a38';
      g.beginPath();
      g.arc(ox, 14, 8, Math.PI, Math.PI * 2);
      g.fill();
      g.fillStyle = '#9a2020';
      g.fillRect(ox - 2, 4, 4, 8);
    }
    return c;
  }

  function mount(opts) {
    var scene = opts.scene;
    var start = opts.start || { x: 480, y: 640 };
    var speed = opts.speed || 140;
    var getHeight = opts.getHeight || function () { return 0; };
    var onStatus = opts.onStatus || function () {};
    var project = opts.project;
    var getModelY = opts.getModelY || function () { return 0; };
    var cam = scene.cameras.main;
    var is3d = typeof project === 'function';
    var model = {
      x: is3d ? (start.x || 0) : 0,
      z: is3d ? (start.z != null ? start.z : start.y) : 0
    };

    if (!scene.textures.exists('walk-soldier')) {
      var sheet = makeSheet();
      var tex = scene.textures.addCanvas('walk-soldier', sheet);
      for (var fi = 0; fi < 4; fi++) tex.add(String(fi), 0, fi * 64, 0, 64, 80);
    }
    if (!scene.anims.exists('walk')) {
      scene.anims.create({
        key: 'walk',
        frames: [
          { key: 'walk-soldier', frame: '0' },
          { key: 'walk-soldier', frame: '1' },
          { key: 'walk-soldier', frame: '2' },
          { key: 'walk-soldier', frame: '3' }
        ],
        frameRate: 8,
        repeat: -1
      });
    }
    if (!scene.anims.exists('idle')) {
      scene.anims.create({
        key: 'idle',
        frames: [{ key: 'walk-soldier', frame: '1' }],
        frameRate: 1
      });
    }

    var sprite = scene.add.sprite(start.x || 0, start.y || 0, 'walk-soldier', '1');
    sprite.setOrigin(0.5, 0.92);
    sprite.setScale(1.05);
    sprite.setInteractive({ useHandCursor: true, cursor: 'pointer' });
    sprite.setDepth(20);

    var ring = scene.add.ellipse(sprite.x, sprite.y + 8, 34, 14, 0xe8c86a, 0.0);
    ring.setStrokeStyle(2, 0xe8c86a, 0.95);
    ring.setDepth(19);
    ring.setVisible(false);

    var selected = false;
    var tween = null;
    var followOn = false;

    function place() {
      if (is3d) {
        var y = getModelY(model.x, model.z);
        var p = project(model.x, y, model.z);
        if (p) {
          sprite.setPosition(p.x, p.y);
          var sc = 1.08 + Math.min(0.22, y * 0.35);
          if (p.scale) sc *= p.scale;
          sprite.setScale(sc);
        }
      } else {
        var h = getHeight(sprite.x, sprite.y);
        sprite.setScale(1.02 + Math.min(0.12, h / 5000));
      }
      ring.setPosition(sprite.x, sprite.y + 8);
    }

    function setSelected(on) {
      selected = !!on;
      ring.setVisible(selected);
      onStatus(selected
        ? 'Солдат выбран · клик по карте — идти'
        : 'Кликните солдата, затем точку на карте');
    }

    function stopWalk() {
      if (tween) { tween.stop(); tween = null; }
      sprite.anims.play('idle', true);
      followOn = false;
    }

    function moveTo(x, y) {
      if (is3d) {
        var dx = x - model.x, dz = y - model.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.012) return;
        stopWalk();
        sprite.setFlipX(dx < 0);
        sprite.anims.play('walk', true);
        followOn = true;
        tween = scene.tweens.add({
          targets: model,
          x: x,
          z: y,
          duration: Math.max(280, dist / speed * 1000),
          ease: 'Linear',
          onUpdate: place,
          onComplete: function () {
            tween = null;
            sprite.anims.play('idle', true);
            followOn = false;
            place();
            onStatus('Солдат на месте · клик по карте — новый приказ');
          }
        });
        onStatus('Солдат идёт…');
        return;
      }
      var ddx = x - sprite.x, ddy = y - sprite.y;
      var d2 = Math.sqrt(ddx * ddx + ddy * ddy);
      if (d2 < 4) return;
      stopWalk();
      sprite.setFlipX(ddx < 0);
      sprite.anims.play('walk', true);
      followOn = true;
      tween = scene.tweens.add({
        targets: sprite,
        x: x,
        y: y,
        duration: Math.max(280, d2 / speed * 1000),
        ease: 'Linear',
        onUpdate: place,
        onComplete: function () {
          tween = null;
          sprite.anims.play('idle', true);
          followOn = false;
          place();
          onStatus('Солдат на месте · клик по карте — новый приказ');
        }
      });
      onStatus('Солдат идёт…');
    }

    sprite.on('pointerdown', function (pointer, lx, ly, event) {
      if (event && event.stopPropagation) event.stopPropagation();
      setSelected(true);
      scene._walkIgnoreClick = true;
    });

    scene.events.on('update', function () {
      if (is3d) {
        place();
        return;
      }
      ring.setPosition(sprite.x, sprite.y + 8);
      if (followOn) {
        var mx = cam.midPoint.x, my = cam.midPoint.y;
        cam.scrollX += (sprite.x - mx) * 0.07;
        cam.scrollY += (sprite.y - my) * 0.07;
      }
    });

    place();
    onStatus('Кликните солдата, затем точку на карте');
    return {
      sprite: sprite,
      isSelected: function () { return selected; },
      moveTo: moveTo,
      setSelected: setSelected,
      sync: place
    };
  }

  global.WalkUnitPhaser = { mount: mount };
})(typeof window !== 'undefined' ? window : this);
