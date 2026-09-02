/**
 * Состояние глобальной кампании: фракции, провинции, города, армии, туман, события.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'rome_campaign_v9';

  var FACTIONS = {
    rome: { id: 'rome', name: 'Рим', color: 'rgba(140, 90, 50, 0.12)', banner: '#6a3d8a', army: '#8b3a6a' },
    greek: { id: 'greek', name: 'Греки', color: 'rgba(210, 180, 70, 0.10)', banner: '#b08a38', army: '#c9a030' },
    carthage: { id: 'carthage', name: 'Карфаген', color: 'rgba(180, 70, 50, 0.10)', banner: '#9a3a32', army: '#b8423a' }
  };

  var PROVINCE_OWNERS = {
    cisalpina: 'rome', venetia: 'rome', liguria: 'rome', etruria: 'rome',
    umbria: 'rome', latium: 'rome', campania: 'rome', apulia: 'greek',
    calabria: 'greek', sicilia: 'carthage', sardinia: 'carthage'
  };

  var BUILDINGS = {
    walls: { id: 'walls', name: 'Стены', icon: '🏛️', cost: 800, turns: 2 },
    barracks: { id: 'barracks', name: 'Казармы', icon: '⚔️', cost: 600, turns: 2 },
    temple: { id: 'temple', name: 'Храм', icon: '⛩️', cost: 500, turns: 2 },
    forum: { id: 'forum', name: 'Форум', icon: '🏺', cost: 700, turns: 3 },
    aqueduct: { id: 'aqueduct', name: 'Акведук', icon: '🌊', cost: 900, turns: 3 },
    farm: { id: 'farm', name: 'Фермы', icon: '🌾', cost: 400, turns: 1 },
    roads: { id: 'roads', name: 'Дороги', icon: '🛤️', cost: 350, turns: 1 }
  };

  var CITIES = [
    { name: 'Mediolanium', ru: 'Медиолан', region: 'cisalpina', lon: 9.19, lat: 45.46, x: 1860, y: 510, faction: 'rome' },
    { name: 'Patavium', ru: 'Патавий', region: 'venetia', lon: 11.88, lat: 45.41, x: 2418, y: 438, faction: 'rome' },
    { name: 'Genua', ru: 'Генуя', region: 'liguria', lon: 8.93, lat: 44.41, x: 1440, y: 900, faction: 'rome' },
    { name: 'Arretium', ru: 'Арреций', region: 'etruria', lon: 11.88, lat: 43.46, x: 1680, y: 1260, faction: 'rome' },
    { name: 'Ariminum', ru: 'Аримин', region: 'umbria', lon: 12.57, lat: 44.06, x: 2340, y: 1350, faction: 'rome' },
    { name: 'Roma', ru: 'Рим', region: 'latium', lon: 12.48, lat: 41.89, x: 2100, y: 1680, faction: 'rome', capital: true },
    { name: 'Capua', ru: 'Капуя', region: 'campania', lon: 14.22, lat: 41.10, x: 2637, y: 1989, faction: 'rome' },
    { name: 'Tarentum', ru: 'Тарент', region: 'apulia', lon: 17.24, lat: 40.47, x: 3480, y: 2340, faction: 'greek' },
    { name: 'Rhegium', ru: 'Регий', region: 'calabria', lon: 15.65, lat: 38.11, x: 2760, y: 2880, faction: 'greek' },
    { name: 'Syracusae', ru: 'Сиракузы', region: 'sicilia', lon: 15.29, lat: 37.08, x: 2700, y: 3030, faction: 'greek' },
    { name: 'Caralis', ru: 'Каралис', region: 'sardinia', lon: 9.12, lat: 39.22, x: 870, y: 2100, faction: 'carthage' }
  ];

  var ROAD_LINKS = [
    ['Roma', 'Capua'], ['Roma', 'Arretium'], ['Arretium', 'Ariminum'],
    ['Capua', 'Tarentum'], ['Roma', 'Mediolanium'], ['Mediolanium', 'Patavium'],
    ['Arretium', 'Genua'], ['Tarentum', 'Rhegium'], ['Rhegium', 'Syracusae'],
    ['Genua', 'Caralis']
  ];

  var defaultState = function () {
    var cities = {};
    CITIES.forEach(function (c) {
      cities[c.name] = {
        buildings: c.capital ? ['walls', 'barracks'] : (c.faction === 'rome' ? ['barracks'] : []),
        queue: [],
        garrison: [],
        influence: c.capital ? 95 : 65
      };
    });
    cities.Roma.garrison = [
      { id: 'g_vel_1', unitId: 'velites', name: 'Велиты', strength: 2 },
      { id: 'g_vel_2', unitId: 'velites', name: 'Велиты', strength: 2 }
    ];

    return {
      year: 270,
      bc: true,
      treasury: 5000,
      happiness: 72,
      legions: 3,
      turn: 1,
      timeOfDay: 0.88,
      fogEnabled: true,
      provinceOwners: Object.assign({}, PROVINCE_OWNERS),
      explored: {
        cisalpina: true, venetia: true, liguria: true, etruria: true,
        umbria: true, latium: true, campania: true, apulia: true, calabria: true
      },
      cities: cities,
      selectedCity: null,
      selectedFieldArmyId: null,
      fieldArmies: [
        {
          id: 'field_rome_1',
          faction: 'rome',
          lon: 12.35,
          lat: 41.78,
          general: { name: 'Сципион', avatar: '/images/faceOfScipio.png' },
          units: [
            { id: 'fu_gen_r', unitId: 'general_rome', name: 'Сципион', strength: 7.5, soldiers: 40, isGeneral: true },
            { id: 'fu_leg_1', unitId: 'legionary', name: 'Легионеры', strength: 5, soldiers: 40 },
            { id: 'fu_leg_2', unitId: 'legionary', name: 'Легионеры', strength: 5, soldiers: 40 },
            { id: 'fu_leg_3', unitId: 'legionary', name: 'Легионеры', strength: 5, soldiers: 40 },
            { id: 'fu_leg_4', unitId: 'legionary', name: 'Легионеры', strength: 5, soldiers: 40 },
            { id: 'fu_leg_5', unitId: 'legionary', name: 'Легионеры', strength: 5, soldiers: 40 },
            { id: 'fu_vel_1', unitId: 'velites', name: 'Велиты', strength: 2, soldiers: 40 },
            { id: 'fu_eq_1', unitId: 'equites', name: 'Конница', strength: 5, soldiers: 40 },
            { id: 'fu_eq_2', unitId: 'equites', name: 'Конница', strength: 5, soldiers: 40 }
          ]
        },
        {
          id: 'field_carthage_1',
          faction: 'carthage',
          lon: 14.08,
          lat: 41.18,
          general: { name: 'Ганнибал', avatar: '/images/faceOfganibal.png' },
          units: [
            { id: 'fu_gen_c', unitId: 'general_carthage', name: 'Ганнибал', strength: 7.5, soldiers: 40, isGeneral: true },
            { id: 'fu_pun_1', unitId: 'punic_infantry', name: 'Пехота пунийская', strength: 4, soldiers: 40 },
            { id: 'fu_pun_2', unitId: 'punic_infantry', name: 'Пехота пунийская', strength: 4, soldiers: 40 },
            { id: 'fu_pun_4', unitId: 'elephants', name: 'Слоны', strength: 6, soldiers: 40 }
          ]
        }
      ],
      armies: [
        { id: 'legio_ii', name: 'Legio II', faction: 'rome', x: 1680, y: 1260, tx: 1680, ty: 1260, strength: 16, progress: 1, home: 'Arretium' },
        { id: 'punic_i', name: 'Punic Army', faction: 'carthage', x: 870, y: 2100, tx: 870, ty: 2100, strength: 14, progress: 1, home: 'Caralis' }
      ],
      events: [
        { id: 'ev1', type: 'plague', region: 'sicilia', text: 'Чума в Сицилии', x: 2700, y: 3030, turnsLeft: 3 }
      ]
    };
  };

  var state = defaultState();

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      state = Object.assign(defaultState(), d);
      state.cities = Object.assign(defaultState().cities, d.cities || {});
      Object.keys(state.cities).forEach(function (name) {
        if (!state.cities[name].garrison) state.cities[name].garrison = [];
      });
      if (!state.fieldArmies) state.fieldArmies = defaultState().fieldArmies;
      // обновить состав полевых армий (Ганнибал + 40 солдат в отряде)
      (state.fieldArmies || []).forEach(function (army) {
        if (!army || !army.units) return;
        if (army.id === 'field_carthage_1') {
          var hasHan = army.units.some(function (u) {
            return u.unitId === 'general_carthage' || u.isGeneral;
          });
          if (!hasHan) {
            army.units.unshift({
              id: 'fu_gen_c',
              unitId: 'general_carthage',
              name: 'Ганнибал',
              strength: 7.5,
              soldiers: 40,
              isGeneral: true
            });
          }
          var punCount = army.units.filter(function (u) { return u.unitId === 'punic_infantry'; }).length;
          while (punCount < 2) {
            army.units.push({
              id: 'fu_pun_extra_' + punCount,
              unitId: 'punic_infantry',
              name: 'Пехота пунийская',
              strength: 4,
              soldiers: 40
            });
            punCount++;
          }
        }
        army.units.forEach(function (u) {
          if (u.soldiers == null || u.soldiers < 40) u.soldiers = 40;
        });
      });
      state.provinceOwners = Object.assign({}, PROVINCE_OWNERS, d.provinceOwners || {});
      state.explored = Object.assign({
        cisalpina: true, venetia: true, liguria: true, etruria: true,
        umbria: true, latium: true, campania: true, apulia: true, calabria: true
      }, d.explored || {});
      if (state.timeOfDay < 0.8) state.timeOfDay = 0.88;
      // после боёв иногда у всех остаётся 1 — вернуть по 40
      var allUnits = [];
      (state.fieldArmies || []).forEach(function (army) {
        (army.units || []).forEach(function (u) { allUnits.push(u); });
      });
      if (allUnits.length && allUnits.every(function (u) { return (u.soldiers == null || u.soldiers <= 1); })) {
        allUnits.forEach(function (u) { u.soldiers = 40; });
        save();
      }
    } catch (_) {}
  }

  function getFaction(id) {
    return FACTIONS[id] || FACTIONS.rome;
  }

  function getProvinceOwner(regionId) {
    return state.provinceOwners[regionId] || 'rome';
  }

  function isExplored(regionId) {
    return !state.fogEnabled || !!state.explored[regionId];
  }

  function revealRegion(regionId) {
    state.explored[regionId] = true;
    save();
  }

  function getCity(name) {
    return CITIES.find(function (c) { return c.name === name; });
  }

  function getCityState(name) {
    var cs = state.cities[name];
    if (!cs) return { buildings: [], queue: [], garrison: [], influence: 50 };
    if (!cs.garrison) cs.garrison = [];
    return cs;
  }

  function selectCity(name) {
    state.selectedCity = name;
    state.selectedFieldArmyId = null;
    var c = getCity(name);
    if (c) revealRegion(c.region);
    save();
  }

  function clearSelectedCity() {
    state.selectedCity = null;
    save();
  }

  function getFieldArmy(id) {
    return (state.fieldArmies || []).find(function (a) { return a.id === id; }) || null;
  }

  function selectFieldArmy(id) {
    state.selectedFieldArmyId = id || null;
    if (id) state.selectedCity = null;
    save();
  }

  function getCityGarrison(cityName) {
    return getCityState(cityName).garrison.slice();
  }

  function mergeFieldArmyIntoCity(armyId, cityName) {
    var army = getFieldArmy(armyId);
    var city = getCity(cityName);
    if (!city) {
      city = CITIES.find(function (c) {
        return c.ru === cityName || c.name === cityName;
      });
      if (city) cityName = city.name;
    }
    var cs = getCityState(cityName);
    if (!army || !city || !cs) return false;
    if (!cs.garrison) cs.garrison = [];
    army.units.forEach(function (u, idx) {
      cs.garrison.push({
        id: u.id || ('g_' + Date.now() + '_' + idx),
        unitId: u.unitId,
        name: u.name,
        strength: u.strength
      });
    });
    state.fieldArmies = (state.fieldArmies || []).filter(function (a) { return a.id !== armyId; });
    if (state.selectedFieldArmyId === armyId) state.selectedFieldArmyId = null;
    save();
    return true;
  }

  function formArmyFromGarrison(cityName, unitIds, lon, lat) {
    var city = getCity(cityName);
    var cs = getCityState(cityName);
    if (!city || !cs || !unitIds || !unitIds.length) return null;
    var idSet = {};
    unitIds.forEach(function (id) { idSet[id] = true; });
    var taken = [];
    var left = [];
    cs.garrison.forEach(function (u) {
      if (idSet[u.id]) taken.push(u);
      else left.push(u);
    });
    if (!taken.length) return null;
    cs.garrison = left;
    var army = {
      id: 'field_' + Date.now(),
      faction: city.faction || 'rome',
      lon: lon != null ? lon : city.lon,
      lat: lat != null ? lat : city.lat,
      units: taken.map(function (u) {
        return { id: u.id, unitId: u.unitId, name: u.name, strength: u.strength };
      })
    };
    if (!state.fieldArmies) state.fieldArmies = [];
    state.fieldArmies.push(army);
    state.selectedFieldArmyId = army.id;
    save();
    return army;
  }

  function updateFieldArmyPosition(armyId, lon, lat) {
    var army = getFieldArmy(armyId);
    if (!army) return false;
    army.lon = lon;
    army.lat = lat;
    save();
    return true;
  }

  function findNearestCity(lon, lat, maxDeg) {
    maxDeg = maxDeg != null ? maxDeg : 0.55;
    var best = null;
    var bestD = 1e9;
    CITIES.forEach(function (c) {
      var dlon = (c.lon - lon) * 0.72;
      var dlat = c.lat - lat;
      var d = Math.sqrt(dlon * dlon + dlat * dlat);
      if (d < bestD) { bestD = d; best = c; }
    });
    if (!best || bestD > maxDeg) return null;
    return best;
  }

  function findNearestCityOfFaction(lon, lat, faction, maxDeg) {
    maxDeg = maxDeg != null ? maxDeg : 2.5;
    var best = null;
    var bestD = 1e9;
    CITIES.forEach(function (c) {
      if (faction && c.faction !== faction) return;
      var dlon = (c.lon - lon) * 0.72;
      var dlat = c.lat - lat;
      var d = Math.sqrt(dlon * dlon + dlat * dlat);
      if (d < bestD) { bestD = d; best = c; }
    });
    if (!best || bestD > maxDeg) return null;
    return best;
  }

  /** Город проигравшей фракции в той же провинции, что и точка боя (по ближайшему городу любой фракции). */
  function findNearestCityInProvinceOfFaction(lon, lat, faction) {
    var here = findNearestCity(lon, lat, 8);
    if (!here || !here.region) return null;
    var region = here.region;
    var best = null;
    var bestD = 1e9;
    CITIES.forEach(function (c) {
      if (c.region !== region) return;
      if (faction && c.faction !== faction) return;
      var dlon = (c.lon - lon) * 0.72;
      var dlat = c.lat - lat;
      var d = Math.sqrt(dlon * dlon + dlat * dlat);
      if (d < bestD) { bestD = d; best = c; }
    });
    return best;
  }

  function armySoldierCount(army) {
    if (!army || !army.units) return 0;
    var n = 0;
    army.units.forEach(function (u) {
      n += (u.soldiers != null ? u.soldiers : 100);
    });
    return n;
  }

  function armyUnitCount(army) {
    return (army && army.units) ? army.units.length : 0;
  }

  function applyArmyCasualties(army, ratio) {
    if (!army || !army.units) return;
    ratio = ratio == null ? 0.3 : ratio;
    army.units.forEach(function (u) {
      var base = u.soldiers != null ? u.soldiers : 100;
      u.soldiers = Math.max(1, Math.floor(base * (1 - ratio)));
    });
    save();
  }

  /** Синхронизация солдат полевой армии после локального боя. */
  function applyArmyBattleResult(army, unitResults) {
    if (!army || !army.units || !unitResults) return;
    unitResults.forEach(function (pu) {
      var u = null;
      var i;
      for (i = 0; i < army.units.length; i++) {
        if (army.units[i].id === pu.id) { u = army.units[i]; break; }
      }
      if (!u && pu.unitId) {
        for (i = 0; i < army.units.length; i++) {
          if (army.units[i].unitId === pu.unitId && army.units[i].soldiers === pu._matchHint) {
            u = army.units[i];
            break;
          }
        }
      }
      if (!u && pu.index != null) u = army.units[pu.index];
      if (!u) return;
      // беглецы с 1 чел. — оставляем отряд, но не меньше 1
      u.soldiers = Math.max(0, Math.floor(pu.soldiers != null ? pu.soldiers : 0));
    });
    army.units = army.units.filter(function (u) {
      return (u.soldiers != null ? u.soldiers : 0) > 0;
    });
    save();
  }

  /** Выставить всем отрядам полевой армии по 100 солдат. */
  function restoreFieldArmiesFull() {
    (state.fieldArmies || []).forEach(function (army) {
      (army.units || []).forEach(function (u) {
        u.soldiers = 40;
      });
    });
    save();
  }

  function getRoads() {
    var byName = {};
    CITIES.forEach(function (c) { byName[c.name] = c; });
    var roads = [];
    ROAD_LINKS.forEach(function (pair) {
      var a = byName[pair[0]];
      var b = byName[pair[1]];
      if (a && b) roads.push({ a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } });
    });
    return roads;
  }

  function getSupplyLines() {
    var roma = getCity('Roma');
    if (!roma) return [];
    var lines = [];
    state.armies.forEach(function (army) {
      if (army.faction !== 'rome') return;
      lines.push({
        from: { x: roma.x, y: roma.y },
        to: { x: army.x, y: army.y }
      });
    });
    return lines;
  }

  function advanceArmies(dt) {
    state.armies.forEach(function (army) {
      if (army.progress >= 1) return;
      army.progress = Math.min(1, army.progress + (dt || 0.015));
      army.x = army.x + (army.tx - army.x) * (dt || 0.015);
      army.y = army.y + (army.ty - army.y) * (dt || 0.015);
      if (army.progress >= 0.99) {
        army.progress = 1;
        army.x = army.tx;
        army.y = army.ty;
      }
    });
  }

  function endTurn() {
    state.turn += 1;
    state.year -= state.bc ? 1 : -1;
    if (state.year <= 0 && state.bc) { state.year = 1; state.bc = false; }
    state.treasury += 200;
    state.happiness = Math.max(20, Math.min(100, state.happiness + (Math.random() > 0.5 ? 1 : -1)));

    Object.keys(state.cities).forEach(function (name) {
      var cs = state.cities[name];
      if (cs.queue && cs.queue.length) {
        cs.queue[0].turnsLeft -= 1;
        if (cs.queue[0].turnsLeft <= 0) {
          cs.buildings.push(cs.queue[0].id);
          cs.queue.shift();
        }
      }
    });

    state.events.forEach(function (ev) {
      if (ev.turnsLeft != null) ev.turnsLeft -= 1;
    });
    state.events = state.events.filter(function (ev) { return ev.turnsLeft == null || ev.turnsLeft > 0; });

    state.armies.forEach(function (army) {
      if (Math.random() > 0.7 && army.faction === 'rome') {
        var targets = CITIES.filter(function (c) { return c.faction === 'greek' || c.faction === 'carthage'; });
        if (targets.length) {
          var t = targets[Math.floor(Math.random() * targets.length)];
          army.tx = t.x;
          army.ty = t.y;
          army.progress = 0;
        }
      }
    });

    save();
    return state;
  }

  function queueBuilding(cityName, buildingId) {
    var b = BUILDINGS[buildingId];
    var cs = state.cities[cityName];
    if (!b || !cs || state.treasury < b.cost) return false;
    state.treasury -= b.cost;
    cs.queue.push({ id: buildingId, turnsLeft: b.turns });
    save();
    return true;
  }

  /** Уже построенные / в очереди — для нижней вкладки «Поселение». */
  function getSettlementSlots(cityName) {
    if (!cityName) return [];
    var cs = getCityState(cityName);
    var slots = [];
    cs.buildings.forEach(function (id) {
      var b = BUILDINGS[id];
      slots.push({ type: 'built', id: id, name: b ? b.name : id, icon: b ? b.icon : '🏠' });
    });
    cs.queue.forEach(function (q) {
      var b = BUILDINGS[q.id];
      slots.push({ type: 'queue', id: q.id, name: (b ? b.name : q.id) + ' (' + q.turnsLeft + ')', icon: b ? b.icon : '⏳' });
    });
    return slots.slice(0, 20);
  }

  /** Доступные к постройке — для правого меню «Строительство». */
  function getBuildableSlots(cityName) {
    if (!cityName) return [];
    var cs = getCityState(cityName);
    var available = ['farm', 'barracks', 'temple', 'walls', 'forum', 'aqueduct', 'roads'];
    var slots = [];
    available.forEach(function (id) {
      if (cs.buildings.indexOf(id) >= 0) return;
      if (cs.queue.some(function (q) { return q.id === id; })) return;
      var b = BUILDINGS[id];
      if (!b) return;
      slots.push({ type: 'build', id: id, name: b.name, icon: b.icon, cost: b.cost, turns: b.turns });
    });
    return slots;
  }

  var UNITS = {
    legionary: { id: 'legionary', name: 'Легионеры', icon: '🛡️', avatar: '/images/legioner.png', cost: 500, strength: 5 },
    hastati: { id: 'hastati', name: 'Гастаты', icon: '🛡️', avatar: '/images/leg.png', cost: 450, strength: 4 },
    principes: { id: 'principes', name: 'Принципы', icon: '⚔️', avatar: '/images/leg.png', cost: 650, strength: 6 },
    velites: { id: 'velites', name: 'Велиты', icon: '🏹', avatar: '/images/velit.png', cost: 280, strength: 2 },
    equites: { id: 'equites', name: 'Конница', icon: '🐴', avatar: '/images/units/cavalry.svg', cost: 800, strength: 5 },
    general_rome: { id: 'general_rome', name: 'Сципион', icon: '👑', avatar: '/images/faceOfScipio.png', cost: 0, strength: 7.5 },
    general_carthage: { id: 'general_carthage', name: 'Ганнибал', icon: '👑', avatar: '/images/faceOfganibal.png', cost: 0, strength: 7.5 },
    punic_infantry: { id: 'punic_infantry', name: 'Пехота пунийская', icon: '🗡️', avatar: '/images/units/punic_infantry.svg', cost: 400, strength: 4 },
    punic_archers: { id: 'punic_archers', name: 'Лучники', icon: '🏹', avatar: '/images/units/punic_archers.svg', cost: 320, strength: 3 },
    elephants: { id: 'elephants', name: 'Слоны', icon: '🐘', avatar: '/images/units/elephants.svg', cost: 1200, strength: 6 }
  };

  function getRecruitSlots(cityName) {
    var city = getCity(cityName);
    var cs = getCityState(cityName);
    if (!city || city.faction !== 'rome') return [];
    var hasBarracks = cs.buildings.indexOf('barracks') >= 0;
    var ids = hasBarracks ? ['legionary', 'hastati', 'principes', 'velites', 'equites'] : ['legionary', 'velites'];
    return ids.map(function (id) {
      var u = UNITS[id];
      return { type: 'recruit', id: u.id, name: u.name, icon: u.icon, cost: u.cost, strength: u.strength };
    });
  }

  function recruitUnit(cityName, unitId) {
    var city = getCity(cityName);
    var u = UNITS[unitId];
    var cs = getCityState(cityName);
    if (!city || !u || city.faction !== 'rome' || state.treasury < u.cost) return false;
    state.treasury -= u.cost;
    state.legions += 1;
    cs.garrison.push({
      id: 'g_' + Date.now(),
      unitId: u.id,
      name: u.name,
      strength: u.strength
    });
    save();
    return true;
  }

  load();

  global.CampaignState = {
    FACTIONS: FACTIONS,
    BUILDINGS: BUILDINGS,
    UNITS: UNITS,
    CITIES: CITIES,
    ROAD_LINKS: ROAD_LINKS,
    state: state,
    save: save,
    load: load,
    getFaction: getFaction,
    getProvinceOwner: getProvinceOwner,
    isExplored: isExplored,
    revealRegion: revealRegion,
    getCity: getCity,
    getCityState: getCityState,
    selectCity: selectCity,
    clearSelectedCity: clearSelectedCity,
    getCityGarrison: getCityGarrison,
    getFieldArmy: getFieldArmy,
    selectFieldArmy: selectFieldArmy,
    mergeFieldArmyIntoCity: mergeFieldArmyIntoCity,
    formArmyFromGarrison: formArmyFromGarrison,
    updateFieldArmyPosition: updateFieldArmyPosition,
    findNearestCity: findNearestCity,
    findNearestCityOfFaction: findNearestCityOfFaction,
    findNearestCityInProvinceOfFaction: findNearestCityInProvinceOfFaction,
    armySoldierCount: armySoldierCount,
    armyUnitCount: armyUnitCount,
    applyArmyCasualties: applyArmyCasualties,
    applyArmyBattleResult: applyArmyBattleResult,
    restoreFieldArmiesFull: restoreFieldArmiesFull,
    getRoads: getRoads,
    getSupplyLines: getSupplyLines,
    advanceArmies: advanceArmies,
    endTurn: endTurn,
    queueBuilding: queueBuilding,
    getSettlementSlots: getSettlementSlots,
    getBuildableSlots: getBuildableSlots,
    getRecruitSlots: getRecruitSlots,
    recruitUnit: recruitUnit,
    reset: function () { state = defaultState(); save(); }
  };
})(typeof window !== 'undefined' ? window : this);
