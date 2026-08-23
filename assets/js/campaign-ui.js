/**
 * UI кампании: мини-карта, HUD, строительство, туман, армии, события, звук.
 */
(function (global) {
  'use strict';

  var ME = global.MapEngine;
  var CS = global.CampaignState;
  if (!ME || !CS) return;

  var minimapCanvas = null;
  var minimapCtx = null;
  var dayNightEl = null;
  var animId = null;
  var audioCtx = null;
  var ambientOn = false;

  var GEO_REGION = {
    'Piemonte': 'cisalpina', 'Valle d\'Aosta': 'cisalpina', 'Lombardia': 'cisalpina',
    'Liguria': 'liguria', 'Veneto': 'venetia', 'Friuli-Venezia Giulia': 'venetia',
    'Trentino-Alto Adige': 'venetia', 'Emilia-Romagna': 'umbria', 'Toscana': 'etruria',
    'Umbria': 'umbria', 'Marche': 'umbria', 'Lazio': 'latium', 'Abruzzo': 'campania',
    'Molise': 'campania', 'Campania': 'campania', 'Puglia': 'apulia', 'Basilicata': 'calabria',
    'Calabria': 'calabria', 'Sicilia': 'sicilia', 'Sardegna': 'sardinia'
  };

  function init(opts) {
    opts = opts || {};
    minimapCanvas = document.getElementById('minimapCanvas');
    if (minimapCanvas) minimapCtx = minimapCanvas.getContext('2d');
    dayNightEl = document.getElementById('dayNightOverlay');

    var endBtn = document.querySelector('.btn-end-turn');
    if (endBtn) {
      endBtn.onclick = function () {
        CS.endTurn();
        updateHud();
        if (opts.onEndTurn) opts.onEndTurn();
      };
    }

    var soundBtn = document.getElementById('soundToggle');
    if (soundBtn) soundBtn.addEventListener('click', toggleAmbient);

    updateHud();
    clearCityPanels();
    startArmyAnimation(opts.onFrame);
    applyDayNight();
  }

  function updateHud() {
    var s = CS.state;
    var yearEl = document.getElementById('hudYear');
    var treasEl = document.getElementById('hudTreasury');
    var happyEl = document.getElementById('hudHappiness');
    var legEl = document.getElementById('hudLegions');
    var yearTxt = (s.bc ? s.year + ' до н.э.' : s.year + ' н.э.');
    if (yearEl) yearEl.textContent = yearTxt;
    if (treasEl) treasEl.textContent = 'ⓓ ' + s.treasury.toLocaleString('ru');
    if (happyEl) happyEl.textContent = s.happiness + '%';
    if (legEl) legEl.textContent = String(s.legions);
    var ys = document.getElementById('hudYearSide');
    var ts = document.getElementById('hudTreasurySide');
    if (ys) ys.textContent = yearTxt;
    if (ts) ts.textContent = 'ⓓ ' + s.treasury.toLocaleString('ru');
  }

  function applyDayNight() {
    if (!dayNightEl) return;
    dayNightEl.style.background = ME.dayNightOverlay(CS.state.timeOfDay);
  }

  function toggleAmbient() {
    ambientOn = !ambientOn;
    var btn = document.getElementById('soundToggle');
    if (btn) btn.textContent = ambientOn ? '🔊' : '🔇';
    if (!ambientOn) {
      if (audioCtx) try { audioCtx.close(); } catch (_) {}
      audioCtx = null;
      return;
    }
    try {
      audioCtx = new (global.AudioContext || global.webkitAudioContext)();
      var bufSize = 2 * audioCtx.sampleRate;
      var noise = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
      var out = noise.getChannelData(0);
      for (var i = 0; i < bufSize; i++) out[i] = (Math.random() * 2 - 1) * 0.08;
      var src = audioCtx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      var filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      var gain = audioCtx.createGain();
      gain.gain.value = 0.04;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      src.start();
    } catch (_) {}
  }

  var overlayCache = { fill: null, fillKey: '', shroud: null, shroudKey: '', codeMap: null };

  function regionCodeMap(pixelRegions) {
    if (overlayCache.codeMap) return overlayCache.codeMap;
    var map = {};
    (pixelRegions || []).forEach(function (r) {
      map[(r.index != null ? r.index : 0) + 1] = r;
    });
    overlayCache.codeMap = map;
    return map;
  }

  function startArmyAnimation(onFrame) {
    if (animId) cancelAnimationFrame(animId);
    var last = 0;
    function tick(now) {
      var moving = CS.state.armies.some(function (a) { return a.progress < 1; });
      if (moving) CS.advanceArmies(0.02);
      if (moving && onFrame && now - last > 120) {
        last = now;
        onFrame();
      }
      animId = requestAnimationFrame(tick);
    }
    animId = requestAnimationFrame(tick);
  }

  function regionFromFeature(f) {
    var name = (f.properties && (f.properties.reg_name || f.properties.NAME)) || '';
    return GEO_REGION[name] || null;
  }

  function drawFactionFillView1(ctx, features, projectFn, forEachRing) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    for (var i = 0; i < features.length; i++) {
      var rid = regionFromFeature(features[i]);
      if (!rid) continue;
      var fac = CS.getFaction(CS.getProvinceOwner(rid));
      ctx.beginPath();
      forEachRing(features[i].geometry, function (ring) {
        if (!ring || ring.length < 2) return;
        var p0 = projectFn(ring[0][0], ring[0][1]);
        ctx.moveTo(p0[0], p0[1]);
        for (var k = 1; k < ring.length; k++) {
          var p = projectFn(ring[k][0], ring[k][1]);
          ctx.lineTo(p[0], p[1]);
        }
        ctx.closePath();
      });
      ctx.fillStyle = fac.banner;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFactionFillView2(ctx, labelData, pixelRegions, cover) {
    if (!labelData) return;
    var key = JSON.stringify(CS.state.provinceOwners);
    if (!overlayCache.fill || overlayCache.fillKey !== key) {
      var lw = labelData.width;
      var lh = labelData.height;
      var src = labelData.data;
      var off = document.createElement('canvas');
      off.width = lw;
      off.height = lh;
      var g = off.getContext('2d');
      var img = g.createImageData(lw, lh);
      var dst = img.data;
      var cmap = regionCodeMap(pixelRegions);
      for (var y = 0; y < lh; y += 2) {
        for (var x = 0; x < lw; x += 2) {
          var i = (y * lw + x) * 4;
          var code = src[i];
          if (!code) continue;
          var reg = cmap[code];
          if (!reg) continue;
          var fac = CS.getFaction(CS.getProvinceOwner(reg.id));
          var m = fac.color.match(/[\d.]+/g);
          if (!m) continue;
          var a = Math.round((+m[3] || 0.12) * 255);
          for (var oy = 0; oy < 2; oy++) {
            for (var ox = 0; ox < 2; ox++) {
              var j = ((y + oy) * lw + (x + ox)) * 4;
              dst[j] = +m[0]; dst[j + 1] = +m[1]; dst[j + 2] = +m[2]; dst[j + 3] = a;
            }
          }
        }
      }
      g.putImageData(img, 0, 0);
      overlayCache.fill = off;
      overlayCache.fillKey = key;
    }
    ctx.drawImage(overlayCache.fill, cover.dx, cover.dy, cover.dw, cover.dh);
  }

  function drawCampaignLayer(ctx, opts) {
    var s = CS.state;
    var zoom = opts.scale || 1;
    var showLabels = zoom > (opts.minScale || 0.5) * 1.08;

    if (opts.roads !== false) {
      ME.drawRoadNetwork(ctx, CS.getRoads(), 0);
    }

    CS.getSupplyLines().forEach(function (ln) {
      ME.drawSupplyLine(ctx, ln.from, ln.to);
    });

    s.armies.forEach(function (army) {
      var fac = CS.getFaction(army.faction);
      ME.drawArmyStack(ctx, {
        x: army.x, y: army.y, strength: army.strength, color: fac.army
      }, { zoom: zoom });
    });

    CS.CITIES.forEach(function (city) {
      var cs = CS.getCityState(city.name);
      var fac = CS.getFaction(city.faction);
      var pos = opts.cityPos ? opts.cityPos(city) : { x: city.x, y: city.y };
      var explored = CS.isExplored(city.region);
      ME.drawRtwCity(ctx, pos.x, pos.y, {
        name: city.name,
        ru: city.ru,
        capital: city.capital,
        buildings: cs.buildings
      }, {
        iconScale: 26 / zoom,
        bannerColor: fac.banner,
        selected: s.selectedCity === city.name,
        showLabel: showLabels && explored,
        influence: 0
      });
    });

    var B = global.CampaignMapBridge;
    if (B && opts.resources !== false) {
      B.getResources().forEach(function (dig) {
        var pos = opts.lonLatPos
          ? opts.lonLatPos(dig.lon, dig.lat)
          : (opts.cityPos
            ? opts.cityPos({ lon: dig.lon, lat: dig.lat, x: dig.lon * 100, y: dig.lat * 100 })
            : null);
        if (!pos && opts.projectLonLat) pos = opts.projectLonLat(dig.lon, dig.lat);
        if (!pos) return;
        B.drawResourceDig(ctx, pos.x, pos.y, dig.type, { scale: zoom });
      });
    }

    (s.fieldArmies || []).forEach(function (army) {
      var fac = CS.getFaction(army.faction || 'rome');
      var pos = null;
      if (opts.lonLatPos) pos = opts.lonLatPos(army.lon, army.lat);
      else if (opts.projectLonLat) pos = opts.projectLonLat(army.lon, army.lat);
      if (!pos) return;
      ME.drawArmyStack(ctx, {
        x: pos.x, y: pos.y,
        strength: (army.units && army.units.length) || 2,
        color: fac.army
      }, { zoom: zoom });
    });

    s.events.forEach(function (ev) {
      if (CS.isExplored(ev.region)) ME.drawMapEvent(ctx, ev);
    });

    if (s.fogEnabled && opts.provinceFog && opts.labelData && opts.pixelRegions && opts.cover) {
      ME.drawProvinceShroud(ctx, opts.labelData, opts.pixelRegions, opts.cover, CS.isExplored.bind(CS));
    }
  }

  function getFogHoles() {
    var holes = [];
    CS.CITIES.forEach(function (c) {
      if (!CS.isExplored(c.region)) return;
      var seed = c.capital ? 320 : 240;
      holes.push({ x: c.x, y: c.y, r: seed });
    });
    pixelRegionSeeds(holes);
    CS.state.armies.forEach(function (a) {
      holes.push({ x: a.x, y: a.y, r: 140 });
    });
    return holes;
  }

  function pixelRegionSeeds(holes) {
    if (!global.View2PixelRegions || !global.View2PixelRegions.regions) return;
    global.View2PixelRegions.regions.forEach(function (reg) {
      if (!CS.isExplored(reg.id) || !reg.seed) return;
      holes.push({ x: reg.seed[0], y: reg.seed[1], r: 280 });
    });
  }

  function renderMinimap(opts) {
    if (!minimapCtx || !minimapCanvas) return;
    opts = opts || {};
    var citiesLonLat = (CS.CITIES || []).map(function (c) {
      return { lon: c.lon, lat: c.lat, capital: c.capital };
    });
    var provinceSeeds = opts.provinceSeeds || null;
    if (!provinceSeeds && global.View14Provinces) {
      provinceSeeds = View14Provinces.filter(function (p) { return p.city && !p.hidden; });
    }
    ME.drawMinimap(minimapCtx, {
      width: minimapCanvas.width,
      height: minimapCanvas.height,
      geojson: opts.geojson || null,
      bbox: opts.bbox || [6.6, 36.4, 18.6, 47.15],
      highlightRings: opts.highlightRings || null,
      viewQuad: opts.viewQuad || null,
      viewBox: opts.viewBox || null,
      citiesLonLat: citiesLonLat,
      provinceSeeds: provinceSeeds,
      mapW: opts.mapW,
      mapH: opts.mapH,
      cities: CS.CITIES,
      viewport: opts.viewport
    });
  }

  var selectedGarrisonIds = {};
  var viewingFieldArmyId = null;

  function openEntityDetail(entityId) {
    if (!entityId) return;
    if (global.openEntityDetailPage) {
      global.openEntityDetailPage(entityId);
      return;
    }
    if (global.openSecondaryModal) {
      global.openSecondaryModal(
        'pageOfDetailAboutUnitAndBuild.html?entity=' + encodeURIComponent(entityId),
        { position: 'left' }
      );
    }
  }

  function clearGarrisonSelection() {
    selectedGarrisonIds = {};
  }

  function getSelectedGarrisonIds() {
    return Object.keys(selectedGarrisonIds).filter(function (id) { return selectedGarrisonIds[id]; });
  }

  function toggleGarrisonSelect(unitId, additive) {
    if (!additive) {
      var was = !!selectedGarrisonIds[unitId];
      selectedGarrisonIds = {};
      if (!was) selectedGarrisonIds[unitId] = true;
    } else {
      selectedGarrisonIds[unitId] = !selectedGarrisonIds[unitId];
    }
  }

  function bindGarrisonSlot(el, unit) {
    if (!el || !unit) return;
    el.style.cursor = 'pointer';
    el.dataset.unitUid = unit.id;
    if (selectedGarrisonIds[unit.id]) el.classList.add('garrison-selected');
    el.title = unit.name + ' · ЛКМ — выбрать · Ctrl+ЛКМ — несколько · ПКМ — описание · ПКМ по карте — вывести армию';
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleGarrisonSelect(unit.id, e.ctrlKey || e.metaKey);
      renderArmyPanel(CS.state.selectedCity);
    });
    el.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openEntityDetail(unit.unitId || 'legionary');
    });
  }

  function bindEntitySlot(el, entityId) {
    if (!el || !entityId) return;
    el.style.cursor = 'pointer';
    el.title = (el.title || '') + (el.title ? ' · ' : '') + 'ЛКМ / ПКМ — описание';
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openEntityDetail(entityId);
    });
    el.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openEntityDetail(entityId);
    });
  }

  function renderSettlementPanel(cityName) {
    var grid = document.getElementById('settlementGrid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!cityName) return;
    var slots = CS.getSettlementSlots(cityName);
    slots.forEach(function (slot) {
      var el = document.createElement('div');
      el.className = 'card-slot settlement-slot' + (slot.type === 'built' ? ' built' : ' queue');
      el.innerHTML = '<span class="slot-icon">' + slot.icon + '</span><span class="slot-name">' + slot.name + '</span>';
      el.title = slot.name;
      bindEntitySlot(el, slot.id);
      grid.appendChild(el);
    });
  }

  function fillUnitCards(units, readonly) {
    var ag = document.getElementById('armyGrid');
    var ag2 = document.getElementById('armyGrid2');
    if (!ag || !ag2) return;
    ag.innerHTML = '';
    ag2.innerHTML = '';
    (units || []).forEach(function (a, i) {
      var target = i < 10 ? ag : ag2;
      var u = (CS.UNITS && a.unitId && CS.UNITS[a.unitId]) || null;
      var el = document.createElement('div');
      el.className = 'card-slot settlement-slot built';
      el.innerHTML = '<span class="slot-icon">' + (u ? u.icon : '⚔️') + '</span><span class="slot-name">' + a.name + '</span>';
      el.title = a.name + (a.strength != null ? (' · сила ' + a.strength) : '');
      if (readonly) {
        bindEntitySlot(el, a.unitId || 'legionary');
      } else {
        bindGarrisonSlot(el, a);
      }
      target.appendChild(el);
    });
  }

  function renderArmyPanel(cityName) {
    viewingFieldArmyId = null;
    if (!cityName) {
      fillUnitCards([]);
      return;
    }
    fillUnitCards(CS.getCityGarrison(cityName), false);
  }

  function renderFieldArmyPanel(armyId) {
    var army = CS.getFieldArmy ? CS.getFieldArmy(armyId) : null;
    if (!army && CS.state.selectedFieldArmyId) {
      army = CS.getFieldArmy(CS.state.selectedFieldArmyId);
      if (army) armyId = army.id;
    }
    var ag = document.getElementById('armyGrid');
    var ag2 = document.getElementById('armyGrid2');
    var sg = document.getElementById('settlementGrid');
    if (!army) {
      fillUnitCards([]);
      return;
    }
    viewingFieldArmyId = armyId;
    clearGarrisonSelection();
    if (sg) {
      sg.style.display = 'none';
      sg.innerHTML = '';
    }
    if (ag) ag.style.display = 'flex';
    if (ag2) ag2.style.display = 'flex';
    document.querySelectorAll('.tab-btn').forEach(function (btn, i) {
      btn.classList.toggle('active', i === 0);
    });
    fillUnitCards(army.units || [], true);
  }

  function clearCityPanels() {
    clearGarrisonSelection();
    viewingFieldArmyId = null;
    renderSettlementPanel(null);
    renderArmyPanel(null);
  }

  function openCity(city, callbacks) {
    clearGarrisonSelection();
    viewingFieldArmyId = null;
    if (CS.selectFieldArmy) CS.selectFieldArmy(null);
    CS.selectCity(city.name);
    renderSettlementPanel(city.name);
    renderArmyPanel(city.name);
    var tab = (callbacks && callbacks.tab) || 'settlement';
    if (callbacks && callbacks.switchTab) callbacks.switchTab(tab);
    else if (typeof global.switchTab === 'function') global.switchTab(tab);
    if (callbacks && callbacks.openPanel) callbacks.openPanel(city.ru || city.name);
    if (callbacks && callbacks.flyTo) callbacks.flyTo(city);
    updateHud();
  }

  function openFieldArmy(armyId, callbacks) {
    var army = CS.getFieldArmy ? CS.getFieldArmy(armyId) : null;
    if (!army && CS.state.fieldArmies && CS.state.fieldArmies.length) {
      army = CS.state.fieldArmies[CS.state.fieldArmies.length - 1];
      armyId = army.id;
    }
    if (!army) return;
    if (CS.selectFieldArmy) CS.selectFieldArmy(armyId);
    renderFieldArmyPanel(armyId);
    if (typeof global.switchTab === 'function') {
      // только подсветка вкладки, без перерисовки гарнизона
      document.querySelectorAll('.tab-btn').forEach(function (btn, i) {
        btn.classList.toggle('active', i === 0);
      });
      var sg = document.getElementById('settlementGrid');
      var ag = document.getElementById('armyGrid');
      var ag2 = document.getElementById('armyGrid2');
      if (sg) sg.style.display = 'none';
      if (ag) ag.style.display = 'flex';
      if (ag2) ag2.style.display = 'flex';
    }
    if (callbacks && callbacks.switchTab) callbacks.switchTab('army');
    updateHud();
  }

  function tryDeployGarrison(lon, lat) {
    var ids = getSelectedGarrisonIds();
    var cityName = CS.state.selectedCity;
    if (!ids.length || !cityName || !CS.formArmyFromGarrison) return null;
    var city = CS.getCity(cityName);
    var army = CS.formArmyFromGarrison(
      cityName,
      ids,
      lon != null ? lon : (city && city.lon),
      lat != null ? lat : (city && city.lat)
    );
    if (!army) return null;
    clearGarrisonSelection();
    // Сначала показываем состав армии, не затирая его рендером гарнизона
    openFieldArmy(army.id);
    return { army: army, fromLon: city ? city.lon : army.lon, fromLat: city ? city.lat : army.lat };
  }

  function deselectCity(callbacks) {
    if (CS.clearSelectedCity) CS.clearSelectedCity();
    else CS.state.selectedCity = null;
    clearCityPanels();
    if (callbacks && callbacks.closePanel) callbacks.closePanel();
    updateHud();
  }

  function flyToCity(city, camera, applyFn, duration) {
    duration = duration || 600;
    var start = performance.now();
    var fromTx = camera.tx;
    var fromTy = camera.ty;
    var fromScale = camera.scale;
    var targetScale = Math.min(camera.maxScale, Math.max(camera.minScale, camera.minScale * 1.35));
    var rect = camera.viewportRect;
    var pos = camera.cityPos(city);
    var targetTx = rect.width / 2 - (pos.x - camera.mapW / 2) * targetScale;
    var targetTy = rect.height / 2 - (pos.y - camera.mapH / 2) * targetScale;

    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

    function step(now) {
      var t = Math.min(1, (now - start) / duration);
      var e = ease(t);
      camera.tx = fromTx + (targetTx - fromTx) * e;
      camera.ty = fromTy + (targetTy - fromTy) * e;
      camera.scale = fromScale + (targetScale - fromScale) * e;
      applyFn();
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function syncToIframe(frame) {
    if (!frame || !frame.contentWindow) return;
    try {
      var B = global.CampaignMapBridge;
      var payload = B && B.buildSyncPayload
        ? B.buildSyncPayload(CS)
        : {
          provinceOwners: CS.state.provinceOwners,
          explored: CS.state.explored,
          armies: CS.state.armies,
          fieldArmies: CS.state.fieldArmies || [],
          events: CS.state.events,
          fogEnabled: CS.state.fogEnabled,
          timeOfDay: CS.state.timeOfDay,
          cities: CS.CITIES,
          roads: CS.ROAD_LINKS
        };
      frame.contentWindow.postMessage({
        type: 'campaign-sync',
        state: payload
      }, '*');
    } catch (_) {}
  }

  global.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'campaign-request-sync') return;
    var frame = document.getElementById('mapExtraFrame');
    syncToIframe(frame);
  });

  global.CampaignUI = {
    init: init,
    updateHud: updateHud,
    drawFactionFillView1: drawFactionFillView1,
    drawFactionFillView2: drawFactionFillView2,
    drawCampaignLayer: drawCampaignLayer,
    getFogHoles: getFogHoles,
    renderMinimap: renderMinimap,
    renderSettlementPanel: renderSettlementPanel,
    renderArmyPanel: renderArmyPanel,
    renderFieldArmyPanel: renderFieldArmyPanel,
    clearCityPanels: clearCityPanels,
    openCity: openCity,
    openFieldArmy: openFieldArmy,
    deselectCity: deselectCity,
    openEntityDetail: openEntityDetail,
    getSelectedGarrisonIds: getSelectedGarrisonIds,
    clearGarrisonSelection: clearGarrisonSelection,
    tryDeployGarrison: tryDeployGarrison,
    flyToCity: flyToCity,
    syncToIframe: syncToIframe,
    regionFromFeature: regionFromFeature
  };
})(typeof window !== 'undefined' ? window : this);
