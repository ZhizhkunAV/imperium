/**
 * Общая система боя для всех карт кампании.
 * Диалог контакта: Отступить / Автобой / Бой на карте.
 */
(function (global) {
  'use strict';

  var ROME_ARMY_ID = 'field_rome_1';
  var CARTHAGE_ARMY_ID = 'field_carthage_1';
  var STEP_BACK = 3.2; // мировые единицы (~3 шага)
  var activeCtx = null;
  var modalEl = null;

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

  function getArmy(id) {
    var CS = parentCS();
    return CS && CS.getFieldArmy ? CS.getFieldArmy(id) : null;
  }

  function ensureModal() {
    if (modalEl && modalEl.parentNode) return modalEl;
    modalEl = document.getElementById('battleContactModal');
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.id = 'battleContactModal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.innerHTML =
      '<div class="bcm-card">' +
      '<p class="bcm-title">Начинается бой, ваши войска Рима атаковали армию Карфагена</p>' +
      '<div class="bcm-actions">' +
      '<button type="button" data-act="retreat">Отступить</button>' +
      '<button type="button" data-act="auto">Автобой</button>' +
      '<button type="button" data-act="map">Бой на карте</button>' +
      '</div></div>';
    var style = document.createElement('style');
    style.textContent =
      '#battleContactModal{display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.55);' +
      'align-items:center;justify-content:center;font-family:"EB Garamond",Georgia,serif}' +
      '#battleContactModal.show{display:flex}' +
      '#battleContactModal .bcm-card{width:min(92vw,440px);padding:22px 24px 18px;' +
      'background:rgba(14,10,6,.96);border:1px solid rgba(201,168,76,.55);box-shadow:0 18px 48px rgba(0,0,0,.55);text-align:center}' +
      '#battleContactModal .bcm-title{margin:0 0 18px;font-size:18px;line-height:1.4;color:#f5ead0}' +
      '#battleContactModal .bcm-actions{display:flex;flex-direction:column;gap:10px}' +
      '#battleContactModal button{font-family:Cinzel,serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;' +
      'color:#f5e6c8;background:rgba(30,22,12,.95);border:1px solid rgba(201,168,76,.55);padding:10px 16px;cursor:pointer}' +
      '#battleContactModal button:hover{border-color:#e0c878;color:#fff}' +
      '#battleLocalOverlay{display:none!important;position:fixed!important;left:0!important;top:0!important;' +
      'right:0!important;bottom:0!important;width:100vw!important;height:100vh!important;' +
      'border:0!important;z-index:5000!important;background:#0a1208!important}' +
      '#battleLocalOverlay.show,#battleLocalOverlay.is-open{display:block!important}';
    document.head.appendChild(style);
    document.body.appendChild(modalEl);
    modalEl.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      if (act === 'retreat') doRetreat();
      else if (act === 'auto') doAutoBattle();
      else if (act === 'map') doMapBattle();
    });
    return modalEl;
  }

  function hideModal() {
    ensureModal().classList.remove('show');
  }

  function openContact(ctx) {
    activeCtx = ctx || {};
    ensureModal().classList.add('show');
    // прячем старый одно-кнопочный диалог, если есть
    var old = document.getElementById('battleModal');
    if (old) old.classList.remove('show');
  }

  function lonLatFromPair(pair, who) {
    var ctx = activeCtx || {};
    if (!pair || !pair[who] || !pair[who].root) return null;
    var p = pair[who].root.position;
    if (ctx.worldToLonLat) return ctx.worldToLonLat(p.x, p.z);
    if (ctx.SCALE != null && ctx.CX != null && ctx.CY != null) {
      return { lon: p.x / ctx.SCALE + ctx.CX, lat: ctx.CY - p.z / ctx.SCALE };
    }
    return null;
  }

  function placeUnit(pair, who, lon, lat) {
    var ctx = activeCtx || {};
    if (!pair || !pair[who] || !pair[who].root) return;
    var xz = ctx.xz ? ctx.xz(lon, lat) : null;
    if (!xz && ctx.SCALE != null) {
      xz = { x: (lon - ctx.CX) * ctx.SCALE, z: (ctx.CY - lat) * ctx.SCALE };
    }
    if (!xz) return;
    var y = ctx.worldH ? ctx.worldH(lon, lat) : (ctx.getHeight ? ctx.getHeight(xz.x, xz.z) : 0);
    var hover = ctx.hover != null ? ctx.hover : 0.08;
    pair[who].root.position.set(xz.x, y + hover, xz.z);
    if (pair[who].isWalking && pair[who].isWalking()) {
      /* stop walk via move cancel if available */
    }
  }

  function stepBackFromEnemy(pair, mover, enemy, steps) {
    if (!pair || !pair[mover] || !pair[enemy]) return null;
    var a = pair[mover].root.position;
    var b = pair[enemy].root.position;
    var dx = a.x - b.x, dz = a.z - b.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    var dist = (steps != null ? steps : 3) * (STEP_BACK / 3);
    var nx = a.x + dx / len * dist;
    var nz = a.z + dz / len * dist;
    var ll = null;
    var ctx = activeCtx || {};
    if (ctx.worldToLonLat) ll = ctx.worldToLonLat(nx, nz);
    else if (ctx.SCALE != null) ll = { lon: nx / ctx.SCALE + ctx.CX, lat: ctx.CY - nz / ctx.SCALE };
    if (ll) {
      placeUnit(pair, mover, ll.lon, ll.lat);
      var CS = parentCS();
      var armyId = mover === 'player'
        ? (pair.player.getArmyId && pair.player.getArmyId()) || ROME_ARMY_ID
        : CARTHAGE_ARMY_ID;
      if (CS && CS.updateFieldArmyPosition) CS.updateFieldArmyPosition(armyId, ll.lon, ll.lat);
      return ll;
    }
    pair[mover].root.position.x = nx;
    pair[mover].root.position.z = nz;
    return { x: nx, z: nz };
  }

  function retreatToCityOrSteps(pair, who, faction) {
    var CS = parentCS();
    var ll = lonLatFromPair(pair, who);
    if (!ll || !CS) {
      stepBackFromEnemy(pair, who, who === 'player' ? 'npc' : 'player', 3);
      return 'steps';
    }
    // сначала город своей фракции в той же провинции; иначе — 3 шага назад
    var city = CS.findNearestCityInProvinceOfFaction
      ? CS.findNearestCityInProvinceOfFaction(ll.lon, ll.lat, faction)
      : (CS.findNearestCityOfFaction
        ? CS.findNearestCityOfFaction(ll.lon, ll.lat, faction, 1.2)
        : null);
    if (city) {
      placeUnit(pair, who, city.lon, city.lat);
      var armyId = who === 'player'
        ? (pair.player.getArmyId && pair.player.getArmyId()) || ROME_ARMY_ID
        : CARTHAGE_ARMY_ID;
      CS.updateFieldArmyPosition(armyId, city.lon, city.lat);
      return 'city:' + (city.ru || city.name);
    }
    stepBackFromEnemy(pair, who, who === 'player' ? 'npc' : 'player', 3);
    return 'steps';
  }

  function doRetreat() {
    hideModal();
    var pair = activeCtx && activeCtx.getPair ? activeCtx.getPair() : null;
    if (pair) stepBackFromEnemy(pair, 'player', 'npc', 3);
    if (activeCtx && activeCtx.onStatus) activeCtx.onStatus('Рим отступил на 3 шага');
    try {
      global.parent.postMessage({ type: 'battle-result', result: 'retreat' }, '*');
    } catch (_) {}
  }

  function doAutoBattle() {
    hideModal();
    var CS = parentCS();
    var rome = getArmy(ROME_ARMY_ID) || (activeCtx && activeCtx.romeArmy);
    var carth = getArmy(CARTHAGE_ARMY_ID) || (activeCtx && activeCtx.carthageArmy);
    var pair = activeCtx && activeCtx.getPair ? activeCtx.getPair() : null;
    var rN = CS && CS.armyUnitCount ? CS.armyUnitCount(rome) : (rome && rome.units ? rome.units.length : 6);
    var cN = CS && CS.armyUnitCount ? CS.armyUnitCount(carth) : (carth && carth.units ? carth.units.length : 4);
    // при равенстве — побеждает Рим (игрок)
    var romeWins = rN >= cN;
    var msg;
    if (romeWins) {
      if (pair) {
        var where = retreatToCityOrSteps(pair, 'npc', 'carthage');
        msg = where.indexOf('city:') === 0
          ? 'Автобой: Рим победил. Карфаген отступил в ' + where.slice(5)
          : 'Автобой: Рим победил. Карфаген отступил на 3 шага';
      } else {
        msg = 'Автобой: Рим победил';
      }
    } else {
      if (pair) {
        var where2 = retreatToCityOrSteps(pair, 'player', 'rome');
        msg = where2.indexOf('city:') === 0
          ? 'Автобой: Карфаген победил. Рим отступил в ' + where2.slice(5)
          : 'Автобой: Карфаген победил. Рим отступил на 3 шага';
      } else {
        msg = 'Автобой: Карфаген победил';
      }
    }
    if (activeCtx && activeCtx.onStatus) activeCtx.onStatus(msg);
    try {
      global.parent.postMessage({ type: 'battle-result', result: 'auto', romeWins: romeWins, message: msg }, '*');
    } catch (_) {}
  }

  function doMapBattle() {
    hideModal();
    var payload = {
      type: 'battle-open-local',
      romeArmyId: ROME_ARMY_ID,
      carthageArmyId: CARTHAGE_ARMY_ID
    };
    // всегда через родителя кампании — иначе iframe карты даст «узкую панель»
    try {
      if (global.parent && global.parent !== global) {
        global.parent.postMessage(payload, '*');
        return;
      }
    } catch (_) {}
    openLocalBattleOverlay();
  }

  function ensureOverlayStyles() {
    if (document.getElementById('battleOverlayStyles')) return;
    var style = document.createElement('style');
    style.id = 'battleOverlayStyles';
    style.textContent =
      '#battleLocalOverlay{' +
      'display:none!important;position:fixed!important;left:0!important;top:0!important;' +
      'right:0!important;bottom:0!important;width:100vw!important;height:100vh!important;' +
      'max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;' +
      'border:0!important;z-index:5000!important;background:#0a1208!important}' +
      '#battleLocalOverlay.show,#battleLocalOverlay.is-open{display:block!important}';
    document.head.appendChild(style);
  }

  function openLocalBattleOverlay() {
    ensureOverlayStyles();
    // закрыть боковые панели кампании, если открыты
    try {
      if (global.closeSecondaryModal) global.closeSecondaryModal();
      if (global.closeModal) global.closeModal();
    } catch (_) {}
    var frame = document.getElementById('battleLocalOverlay');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.id = 'battleLocalOverlay';
      frame.title = 'Локальный бой';
      frame.setAttribute('allowfullscreen', 'true');
      document.body.appendChild(frame);
    }
    frame.style.cssText =
      'display:block;position:fixed;left:0;top:0;right:0;bottom:0;' +
      'width:100vw;height:100vh;max-width:none;max-height:none;margin:0;padding:0;' +
      'border:0;z-index:5000;background:#0a1208';
    frame.classList.add('show', 'is-open');
    frame.src = '/pages/battleLocal.html';
    function onMsg(e) {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'battle-local-done') {
        closeLocalBattleOverlay();
        global.removeEventListener('message', onMsg);
        // финиш и отступление — через frameForMap → карту (там есть pair)
      }
    }
    global.addEventListener('message', onMsg);
  }

  function closeLocalBattleOverlay() {
    var frame = document.getElementById('battleLocalOverlay');
    if (!frame) return;
    frame.classList.remove('show', 'is-open');
    frame.style.display = 'none';
    frame.src = 'about:blank';
  }

  function finishLocalBattle(data) {
    var CS = parentCS();
    var pair = activeCtx && activeCtx.getPair ? activeCtx.getPair() : null;
    var rome = getArmy(ROME_ARMY_ID);
    var carth = getArmy(CARTHAGE_ARMY_ID);
    data = data || {};

    if (data.surrender) {
      if (CS && CS.applyArmyCasualties) {
        if (rome) CS.applyArmyCasualties(rome, 0.3);
        if (carth) CS.applyArmyCasualties(carth, 0.3);
      }
      if (pair) {
        var whereS = retreatToCityOrSteps(pair, 'player', 'rome');
        if (activeCtx && activeCtx.onStatus) {
          activeCtx.onStatus(
            whereS.indexOf('city:') === 0
              ? 'Сдача: −30% солдат. Рим отступил в ' + whereS.slice(5)
              : 'Сдача: −30% солдат. Рим отступил на 3 шага'
          );
        }
      } else if (activeCtx && activeCtx.onStatus) {
        activeCtx.onStatus('Сдача: армии потеряли 30% солдат');
      }
      return;
    }

    if (CS && CS.applyArmyBattleResult) {
      if (rome && data.romeUnits) CS.applyArmyBattleResult(rome, data.romeUnits);
      if (carth && data.carthUnits) CS.applyArmyBattleResult(carth, data.carthUnits);
    }

    var romeWins = data.winner === 'rome';
    var loserWho = romeWins ? 'npc' : 'player';
    var loserFaction = romeWins ? 'carthage' : 'rome';
    var msg = romeWins ? 'Победа Рима' : 'Победа Карфагена';
    if (pair) {
      var where = retreatToCityOrSteps(pair, loserWho, loserFaction);
      if (where.indexOf('city:') === 0) {
        msg += '. ' + (romeWins ? 'Карфаген' : 'Рим') + ' бежал в ' + where.slice(5);
      } else {
        msg += '. ' + (romeWins ? 'Карфаген' : 'Рим') + ' отступил на 3 шага';
      }
    }
    if (data.romeLost != null || data.carthLost != null) {
      msg +=
        ' · потери Р: ' + (data.romeLost || 0) +
        ', К: ' + (data.carthLost || 0) +
        ' · осталось Р: ' + (data.romeLeft || 0) +
        ', К: ' + (data.carthLeft || 0);
    }
    if (activeCtx && activeCtx.onStatus) activeCtx.onStatus(msg);
  }

  /** Двойной клик по армии Карфагена → панель АРМИЯ (только чтение). */
  function inspectCarthageArmy() {
    var CUI = parentCUI();
    try {
      global.parent.postMessage({ type: 'army-select', armyId: CARTHAGE_ARMY_ID, tab: 'army', readonly: true }, '*');
    } catch (_) {}
    if (CUI && CUI.openFieldArmy) CUI.openFieldArmy(CARTHAGE_ARMY_ID);
  }

  /**
   * Установить бой на карте: заменяет showBattleDialog / вешает на mountPair.
   * opts: { getPair, xz, worldH, SCALE, CX, CY, hover, onStatus, worldToLonLat, getHeight }
   */
  function bindMap(opts) {
    activeCtx = opts || activeCtx || {};
    ensureModal();
    return {
      showBattleDialog: function () { openContact(opts); },
      inspectCarthage: inspectCarthageArmy,
      openContact: openContact,
      finishLocalBattle: finishLocalBattle
    };
  }

  // совместимость: старые карты зовут showBattleDialog()
  function showBattleDialog() {
    openContact(activeCtx || {});
  }

  global.BattleSystem = {
    ROME_ARMY_ID: ROME_ARMY_ID,
    CARTHAGE_ARMY_ID: CARTHAGE_ARMY_ID,
    openContact: openContact,
    bindMap: bindMap,
    showBattleDialog: showBattleDialog,
    inspectCarthageArmy: inspectCarthageArmy,
    openLocalBattleOverlay: openLocalBattleOverlay,
    closeLocalBattleOverlay: closeLocalBattleOverlay,
    finishLocalBattle: finishLocalBattle,
    stepBackFromEnemy: stepBackFromEnemy
  };
})(typeof window !== 'undefined' ? window : this);
