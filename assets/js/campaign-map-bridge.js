/**
 * Общий мост кампании для всех видов карты:
 * города, дороги, полевые армии, копки (ресурсы провинций).
 */
(function (global) {
  'use strict';

  var CITY_ALIAS = {
    Mediolanum: 'Mediolanium',
    Segesta: 'Genua',
    Rome: 'Roma',
    Croton: 'Rhegium',
    Messana: 'Rhegium',
    Syracuse: 'Syracusae',
    Lilybaeum: 'Syracusae',
    Salona: 'Patavium',
    Neapolis: 'Capua'
  };

  var RESOURCE_META = {
    iron: { icon: '⛏', color: '#7a7a7a', label: 'Железо' },
    copper: { icon: '⛏', color: '#b87333', label: 'Медь' },
    silver: { icon: '⛏', color: '#c0c8d0', label: 'Серебро' },
    gold: { icon: '⛏', color: '#d4a820', label: 'Золото' },
    marble: { icon: '◻', color: '#e8e4dc', label: 'Мрамор' },
    timber: { icon: '🌲', color: '#2d5a28', label: 'Лес' },
    wine: { icon: '🍇', color: '#6a2040', label: 'Вино' },
    grain: { icon: '🌾', color: '#c9a84a', label: 'Зерно' },
    pottery: { icon: '🏺', color: '#a07040', label: 'Керамика' },
    glass: { icon: '◆', color: '#6ec0d8', label: 'Стекло' },
    textiles: { icon: '🧵', color: '#8a6aaa', label: 'Ткани' },
    olive: { icon: '🫒', color: '#6a8a40', label: 'Олива' }
  };

  function parentCS() {
    try {
      if (global.parent && global.parent !== global && global.parent.CampaignState) {
        return global.parent.CampaignState;
      }
    } catch (_) {}
    return global.CampaignState || null;
  }

  function parentCUI() {
    try {
      if (global.parent && global.parent !== global && global.parent.CampaignUI) {
        return global.parent.CampaignUI;
      }
    } catch (_) {}
    return global.CampaignUI || null;
  }

  function campaignName(name) {
    return CITY_ALIAS[name] || name;
  }

  function factionToCampaign(factionId) {
    if (factionId === 'spqr' || factionId === 'julii' || factionId === 'brutii' || factionId === 'scipii' || factionId === 'rome' || factionId === 'papal') {
      return 'rome';
    }
    if (factionId === 'greek' || factionId === 'byzantium') return 'greek';
    if (factionId === 'carthage' || factionId === 'moors') return 'carthage';
    return 'rome';
  }

  function getProvinces() {
    return global.View16Provinces
      || global.View14Provinces
      || (function () {
        try {
          return (global.parent && global.parent.View16Provinces)
            || (global.parent && global.parent.View14Provinces);
        } catch (_) { return null; }
      })()
      || [];
  }

  function buildResourceMarkers() {
    var out = [];
    var provs = getProvinces();
    for (var i = 0; i < provs.length; i++) {
      var p = provs[i];
      if (p.hidden || !p.resources || !p.resources.length) continue;
      for (var r = 0; r < p.resources.length; r++) {
        var type = p.resources[r];
        var ang = (r / Math.max(1, p.resources.length)) * Math.PI * 2 + 0.4;
        var dist = 0.22 + r * 0.06;
        out.push({
          id: p.id + '_' + type + '_' + r,
          type: type,
          provinceId: p.id,
          lon: p.lon + Math.cos(ang) * dist,
          lat: p.lat + Math.sin(ang) * dist * 0.72,
          meta: RESOURCE_META[type] || { icon: '⛏', color: '#888', label: type }
        });
      }
    }
    return out;
  }

  function getCities(sync) {
    var CS = parentCS();
    if (CS && CS.CITIES && CS.CITIES.length) return CS.CITIES;
    if (sync && sync.cities && sync.cities.length) return sync.cities;
    var provs = getProvinces();
    var list = [];
    for (var i = 0; i < provs.length; i++) {
      var p = provs[i];
      if (p.hidden || !p.city) continue;
      list.push({
        name: campaignName(p.city),
        ru: p.cityRu || p.city,
        region: p.id,
        lon: p.lon,
        lat: p.lat,
        faction: factionToCampaign(p.faction),
        capital: !!p.capital
      });
    }
    return list;
  }

  function getRoads(sync) {
    var CS = parentCS();
    if (CS && CS.ROAD_LINKS && CS.ROAD_LINKS.length) return CS.ROAD_LINKS;
    if (sync && sync.roads && sync.roads.length) return sync.roads;
    return global.View16Roads || global.View14Roads || [];
  }

  function getFieldArmies(sync) {
    var CS = parentCS();
    if (CS && CS.state && CS.state.fieldArmies) return CS.state.fieldArmies;
    return (sync && sync.fieldArmies) || [];
  }

  function getResources(sync) {
    if (sync && sync.resources && sync.resources.length) return sync.resources;
    return buildResourceMarkers();
  }

  function buildSyncPayload(CS) {
    CS = CS || parentCS();
    if (!CS) return null;
    return {
      provinceOwners: CS.state.provinceOwners,
      explored: CS.state.explored,
      armies: CS.state.armies,
      fieldArmies: CS.state.fieldArmies || [],
      events: CS.state.events,
      fogEnabled: CS.state.fogEnabled,
      timeOfDay: CS.state.timeOfDay,
      cities: (CS.CITIES || []).map(function (c) {
        return {
          name: c.name, ru: c.ru, region: c.region,
          lon: c.lon, lat: c.lat, faction: c.faction, capital: !!c.capital
        };
      }),
      roads: CS.ROAD_LINKS || [],
      resources: buildResourceMarkers()
    };
  }

  function post(msg) {
    try {
      if (global.parent && global.parent !== global) global.parent.postMessage(msg, '*');
    } catch (_) {}
  }

  function postCitySelect(city, tab) {
    post({ type: 'city-select', city: city, tab: tab || 'settlement' });
  }

  function postCityDeselect() {
    post({ type: 'city-deselect' });
  }

  function postArmySelect(armyId) {
    post({ type: 'army-select', armyId: armyId });
  }

  function postArmyMerged(cityName, cityRu) {
    post({ type: 'army-merged', city: cityName, cityRu: cityRu || cityName });
  }

  function selectCityPayload(city) {
    return {
      name: city.name,
      ru: city.ru || city.name,
      region: city.region || city.view14Id || '',
      lon: city.lon,
      lat: city.lat,
      faction: factionToCampaign(city.faction),
      capital: !!city.capital
    };
  }

  /** 2D: иконка копки на canvas */
  function drawResourceDig(ctx, x, y, type, opts) {
    opts = opts || {};
    var meta = RESOURCE_META[type] || { icon: '⛏', color: '#888' };
    var s = opts.scale || 1;
    var r = 7 / s;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r + 1.5 / s, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = meta.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,200,0.75)';
    ctx.lineWidth = 1.2 / s;
    ctx.stroke();
    ctx.fillStyle = '#fff8e8';
    ctx.font = (10 / s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(meta.icon || '⛏', x, y + 0.5 / s);
    ctx.restore();
  }

  /** 3D: маркеры копок около провинций */
  function addResourceMeshesThree(THREE, scene, markers, xzFn, heightFn, scaleMul) {
    if (!THREE || !scene || !markers) return [];
    scaleMul = scaleMul || 1;
    var roots = [];
    for (var i = 0; i < markers.length; i++) {
      var m = markers[i];
      var p = xzFn(m.lon, m.lat);
      var y = heightFn(m.lon, m.lat);
      var g = new THREE.Group();
      g.position.set(p.x, y + 0.05 * scaleMul, p.z);
      var col = new THREE.Color(m.meta.color || '#888');
      var mound = new THREE.Mesh(
        new THREE.ConeGeometry(0.28 * scaleMul, 0.22 * scaleMul, 5),
        new THREE.MeshPhongMaterial({ color: col, shininess: 4 })
      );
      mound.position.y = 0.08 * scaleMul;
      mound.castShadow = true;
      g.add(mound);
      var pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03 * scaleMul, 0.04 * scaleMul, 0.55 * scaleMul, 5),
        new THREE.MeshPhongMaterial({ color: 0x5a4030 })
      );
      pole.position.y = 0.35 * scaleMul;
      g.add(pole);
      var flag = new THREE.Mesh(
        new THREE.BoxGeometry(0.28 * scaleMul, 0.2 * scaleMul, 0.03 * scaleMul),
        new THREE.MeshPhongMaterial({ color: col })
      );
      flag.position.set(0.14 * scaleMul, 0.52 * scaleMul, 0);
      g.add(flag);
      g.userData.isResource = true;
      g.userData.resource = m;
      scene.add(g);
      roots.push(g);
    }
    return roots;
  }

  /**
   * Общие колбэки полевой армии для WalkUnitThree.mountPair.
   * opts: { getXZ, worldToLonLat, pickLonLat, pickCityName, setStatus, getFieldArmyId, setFieldArmyId,
   *         showArmy, hideArmy, getPlayer }
   */
  function fieldArmyMountExtras(opts) {
    opts = opts || {};
    return {
      beforeRmbMove: function (e) {
        try {
          var CUI = parentCUI();
          if (!CUI || !CUI.getSelectedGarrisonIds || !CUI.getSelectedGarrisonIds().length) return false;
          var ll = opts.pickLonLat && opts.pickLonLat(e);
          if (!ll) return false;
          var dep = CUI.tryDeployGarrison(ll.lon, ll.lat);
          if (!dep || !dep.army) return false;
          if (opts.setFieldArmyId) opts.setFieldArmyId(dep.army.id);
          if (opts.showArmy) opts.showArmy(dep.army.lon, dep.army.lat, dep.army.id);
          postArmySelect(dep.army.id);
          if (opts.setStatus) opts.setStatus('Армия вышла · ЛКМ — выбрать · ПКМ — идти');
          return true;
        } catch (_) { return false; }
      },
      resolveEnterCity: function (e) {
        return opts.pickCityName ? opts.pickCityName(e) : null;
      },
      onSelect: function (on) {
        if (!on) return;
        try {
          var player = opts.getPlayer && opts.getPlayer();
          var aid = player && player.getArmyId && player.getArmyId();
          if (!aid) {
            var CS = parentCS();
            if (CS && CS.state.selectedFieldArmyId) aid = CS.state.selectedFieldArmyId;
            else if (CS && CS.state.fieldArmies && CS.state.fieldArmies.length) {
              aid = CS.state.fieldArmies[CS.state.fieldArmies.length - 1].id;
            } else if (opts.getFieldArmyId) aid = opts.getFieldArmyId();
          }
          if (aid) postArmySelect(aid);
        } catch (_) {}
      },
      onArrive: function (meta, player) {
        if (meta && meta.combat) return;
        try {
          var CS = parentCS();
          if (!CS || !player) return;
          var ll = opts.worldToLonLat(player.root.position.x, player.root.position.z);
          var aid = (player.getArmyId && player.getArmyId()) || (opts.getFieldArmyId && opts.getFieldArmyId());
          if (meta && meta.enterCity && CS.mergeFieldArmyIntoCity(aid, meta.enterCity)) {
            if (opts.setFieldArmyId) opts.setFieldArmyId(null);
            if (opts.hideArmy) opts.hideArmy();
            if (player.setArmyId) player.setArmyId(null);
            var city = CS.getCity(meta.enterCity);
            postArmyMerged(meta.enterCity, city ? city.ru : meta.enterCity);
            if (opts.setStatus) {
              opts.setStatus('Армия вошла в ' + (city ? (city.ru || city.name) : meta.enterCity));
            }
            return;
          }
          if (CS.updateFieldArmyPosition) CS.updateFieldArmyPosition(aid, ll.lon, ll.lat);
          if (player.root) player.root.visible = true;
        } catch (_) {}
      }
    };
  }

  global.CampaignMapBridge = {
    CITY_ALIAS: CITY_ALIAS,
    RESOURCE_META: RESOURCE_META,
    parentCS: parentCS,
    parentCUI: parentCUI,
    campaignName: campaignName,
    factionToCampaign: factionToCampaign,
    getCities: getCities,
    getRoads: getRoads,
    getFieldArmies: getFieldArmies,
    getResources: getResources,
    buildResourceMarkers: buildResourceMarkers,
    buildSyncPayload: buildSyncPayload,
    postCitySelect: postCitySelect,
    postCityDeselect: postCityDeselect,
    postArmySelect: postArmySelect,
    postArmyMerged: postArmyMerged,
    selectCityPayload: selectCityPayload,
    drawResourceDig: drawResourceDig,
    addResourceMeshesThree: addResourceMeshesThree,
    fieldArmyMountExtras: fieldArmyMountExtras
  };
})(typeof window !== 'undefined' ? window : this);
