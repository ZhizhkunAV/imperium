/**
 * Общий хук боя для карт вида: диалог контакта + завершение локального боя.
 */
(function (global) {
  'use strict';

  var lastCtx = null;

  function normalizeCtx(extra) {
    extra = extra || {};
    return {
      getPair: extra.getPair || function () {
        return (global.three && global.three.units) || global.units || null;
      },
      xz: extra.xz,
      worldH: extra.worldH,
      SCALE: extra.SCALE,
      CX: extra.CX,
      CY: extra.CY,
      hover: extra.hover != null ? extra.hover : 0.08,
      onStatus: extra.onStatus || function () {},
      worldToLonLat: extra.worldToLonLat,
      getHeight: extra.getHeight
    };
  }

  function showBattleDialog(ctx) {
    lastCtx = normalizeCtx(ctx);
    if (!global.BattleSystem) {
      openLocalDirect();
      return;
    }
    BattleSystem.bindMap(lastCtx);
    BattleSystem.openContact(lastCtx);
  }

  function openLocalDirect() {
    try {
      if (global.parent && global.parent !== global && global.parent.BattleSystem) {
        global.parent.BattleSystem.openLocalBattleOverlay();
        return;
      }
    } catch (_) {}
    try {
      global.parent.postMessage({ type: 'battle-open-local' }, '*');
    } catch (_) {}
    if (global.BattleSystem && BattleSystem.openLocalBattleOverlay) {
      BattleSystem.openLocalBattleOverlay();
    }
  }

  function onMessage(e) {
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.type === 'battle-local-done' && global.BattleSystem) {
      if (lastCtx) BattleSystem.bindMap(lastCtx);
      BattleSystem.finishLocalBattle(e.data);
    }
  }

  global.addEventListener('message', onMessage);

  global.BattleMapHook = {
    showBattleDialog: showBattleDialog,
    openLocalDirect: openLocalDirect,
    setCtx: function (ctx) {
      lastCtx = normalizeCtx(ctx);
      if (global.BattleSystem) BattleSystem.bindMap(lastCtx);
    }
  };
})(typeof window !== 'undefined' ? window : this);
