(function () {
  const STORAGE_KEY = 'gameLanguage';

  const STRINGS = {
    ru: {
      'page.login': 'Вход — Имперская кампания',
      'page.loading': 'Загрузка — Имперская кампания',
      'page.main': 'Имперская кампания',
      'page.faction': 'Выбор фракции — Имперская кампания',
      'page.settings': 'Настройки — Имперская кампания',
      'page.army': 'Панель армии',
      'page.detail': 'Описание',
      'page.tech': 'Древо технологий — Рим',
      'page.techDetail': 'Описание технологии',
      'page.redirect': 'Перенаправление на страницу входа...',

      'login.subtitle': 'Вход в кампанию',
      'login.commander': 'Имя полководца',
      'login.commanderPlaceholder': 'Введите имя...',
      'login.password': 'Пароль',
      'login.passwordPlaceholder': 'Введите пароль...',
      'login.submit': '⚔️ Войти',
      'login.forgot': 'Забыл пароль?',
      'login.error': 'Неверное имя или пароль',
      'login.success': 'Вход выполнен...',
      'login.forgotHint': 'Отправь сову в Сенат. Пароль восстановят.',

      'loading.hint1': 'Загрузка легионов...',
      'loading.hint2': 'Построение когорт...',
      'loading.hint3': 'Точение гладиусов...',
      'loading.hint4': 'Полировка доспехов...',
      'loading.done': 'Загрузка завершена',
      'menu.subtitle': 'Римская Республика • 270 г. до н.э.',
      'menu.campaign': 'Кампания',
      'menu.settings': 'Настройки',
      'menu.about': 'Об игре',
      'menu.creators': 'О создателях',
      'menu.footer': 'Выберите раздел',

      'main.title': 'Имперская кампания',

      'campaign.title': 'Имперская кампания',
      'campaign.adviceLevel': 'Уровень советов',
      'campaign.advice.low': 'Мало',
      'campaign.advice.high': 'Много',
      'campaign.advice.none': 'Нет',
      'campaign.difficulty': 'Сложность кампании',
      'campaign.battleDifficulty': 'Сложность боя',
      'campaign.difficulty.easy': 'Низкая',
      'campaign.difficulty.medium': 'Средняя',
      'campaign.difficulty.hard': 'Высокая',
      'campaign.options': 'Опции',
      'campaign.manageSettlements': 'Управлять поселениями',
      'campaign.trackAI': 'Следить за ИИ',
      'campaign.mapAlt': 'Карта Средиземноморья',
      'campaign.chooseFaction': 'Выберите фракцию',
      'campaign.portraitAlt': 'Портрет полководца',
      'campaign.faction.rome': 'Римская республика',
      'campaign.faction.carthage': 'Карфаген',
      'campaign.faction.romeShort': 'РИМ',
      'campaign.faction.carthageShort': 'КАРФАГЕН',
      'campaign.back': 'Назад',
      'campaign.forward': 'Вперёд',
      'campaign.shortCampaign': 'Короткая кампания',

      'tabs.units': 'Отряды',
      'tabs.settlement': 'Поселение',
      'info.year': 'Год',
      'info.treasury': 'Казна',
      'info.yearValue': '270 до н.э.',
      'map.placeholder': 'Карта кампании',
      'map.rome': 'Карта кампании (Рим)',
      'map.carthage': 'Карта кампании (Карфаген)',
      'title.campaign.rome': 'Кампания — Римская республика',
      'title.campaign.carthage': 'Кампания — Карфаген',
      'btn.endTurn': 'Конец хода',
      'btn.faction': 'Открыть окно фракции',
      'btn.army': 'Армии',
      'btn.build': 'Строительство',
      'btn.tech': 'Технологии',
      'btn.home': 'На главную',
      'alert.factionLater': 'Окно фракции — будет позже.',
      'alert.endTurn': 'Ход передан другим фракциям.',
      'army.title': '⚔️ Армия',
      'army.commander': '👤 Командующий',
      'army.commanderName': 'Сципион Африканский',
      'army.tab.recruit': '📋 Найм',
      'army.tab.build': '🏗️ Строительство',
      'army.tab.repair': '🔧 Ремонт',
      'army.tab.retrain': '🔄 Переобучение',
      'army.roster': '⚔️ Состав',
      'army.queue.recruit': '📋 Очередь найма:',
      'army.buildings': '🏗️ Доступные постройки',
      'army.queue.build': '🏗️ Очередь строительства:',
      'army.repair.empty': 'Ремонт доступен при наличии повреждённых зданий.',
      'army.retrain.empty': 'Переобучение доступно при наличии отрядов с опытом.',
      'detail.close': 'Закрыть',
      'detail.unknown': 'Нет данных',
      'detail.unknownBadge': 'НЕИЗВЕСТНО',
      'detail.unknownDesc': 'Информация по этой сущности пока отсутствует.',
      'tech.title': '📜 Древо технологий',
      'tech.close': 'Закрыть',
      'tech.researched': '✅ Изучено',
      'techDetail.research': '📚 Изучить',
      'techDetail.researched': '✓ Изучено',
      'techDetail.researchedCost': '✅ Изучено!',
      'settings.title': 'Настройки',
      'settings.sound': '🎵 Звук',
      'settings.video': '🖥️ Видео',
      'settings.language': '🌐 Язык',
      'settings.game': '🎮 Игровые опции',
      'settings.musicVolume': 'Громкость музыки',
      'settings.sfxVolume': 'Громкость звуков',
      'settings.voiceVolume': 'Громкость голоса',
      'settings.resolution': 'Разрешение',
      'settings.graphics': 'Качество графики',
      'settings.uiLanguage': 'Язык интерфейса',
      'settings.lang.ru': 'Русский',
      'settings.lang.en': 'English',
      'settings.graphics.ultra': 'Ультра',
      'settings.graphics.high': 'Высокое',
      'settings.graphics.medium': 'Среднее',
      'settings.graphics.low': 'Низкое',
      'settings.arcade': 'Аркадные сражения',
      'settings.manage': 'Управлять всеми поселениями',
      'settings.trackAI': 'Следить за компьютерными персонажами',
      'settings.back': 'Назад',
      'settings.save': '💾 Сохранить настройки',
      'settings.saved': '✓ Сохранено!',
    },
    en: {
      'page.login': 'Login — Imperial Campaign',
      'page.loading': 'Loading — Imperial Campaign',
      'page.main': 'Imperial Campaign',
      'page.faction': 'Faction Select — Imperial Campaign',
      'page.settings': 'Settings — Imperial Campaign',
      'page.army': 'Army Panel',
      'page.detail': 'Description',
      'page.tech': 'Technology Tree — Rome',
      'page.techDetail': 'Technology Description',
      'page.redirect': 'Redirecting to login page...',

      'login.subtitle': 'Campaign login',
      'login.commander': 'Commander name',
      'login.commanderPlaceholder': 'Enter name...',
      'login.password': 'Password',
      'login.passwordPlaceholder': 'Enter password...',
      'login.submit': '⚔️ Enter',
      'login.forgot': 'Forgot password?',
      'login.error': 'Invalid name or password',
      'login.success': 'Login successful...',
      'login.forgotHint': 'Send an owl to the Senate. They will restore your password.',

      'loading.hint1': 'Loading legions...',
      'loading.hint2': 'Forming cohorts...',
      'loading.hint3': 'Sharpening gladii...',
      'loading.hint4': 'Polishing armor...',
      'loading.done': 'Loading complete',
      'menu.subtitle': 'Roman Republic • 270 BC',
      'menu.campaign': 'Campaign',
      'menu.settings': 'Settings',
      'menu.about': 'About',
      'menu.creators': 'Credits',
      'menu.footer': 'Choose a section',

      'main.title': 'Imperial Campaign',

      'campaign.title': 'Imperial Campaign',
      'campaign.adviceLevel': 'Advisor level',
      'campaign.advice.low': 'Low',
      'campaign.advice.high': 'High',
      'campaign.advice.none': 'None',
      'campaign.difficulty': 'Campaign difficulty',
      'campaign.battleDifficulty': 'Battle difficulty',
      'campaign.difficulty.easy': 'Easy',
      'campaign.difficulty.medium': 'Medium',
      'campaign.difficulty.hard': 'Hard',
      'campaign.options': 'Options',
      'campaign.manageSettlements': 'Manage settlements',
      'campaign.trackAI': 'Track AI',
      'campaign.mapAlt': 'Mediterranean map',
      'campaign.chooseFaction': 'Choose a faction',
      'campaign.portraitAlt': 'Commander portrait',
      'campaign.faction.rome': 'Roman Republic',
      'campaign.faction.carthage': 'Carthage',
      'campaign.faction.romeShort': 'ROME',
      'campaign.faction.carthageShort': 'CARTHAGE',
      'campaign.back': 'Back',
      'campaign.forward': 'Forward',
      'campaign.shortCampaign': 'Short campaign',

      'tabs.units': 'Units',
      'tabs.settlement': 'Settlement',
      'info.year': 'Year',
      'info.treasury': 'Treasury',
      'info.yearValue': '270 BC',
      'map.placeholder': 'Campaign map',
      'map.rome': 'Campaign map (Rome)',
      'map.carthage': 'Campaign map (Carthage)',
      'title.campaign.rome': 'Campaign — Roman Republic',
      'title.campaign.carthage': 'Campaign — Carthage',
      'btn.endTurn': 'End turn',
      'btn.faction': 'Open faction window',
      'btn.army': 'Army',
      'btn.build': 'Construction',
      'btn.tech': 'Technologies',
      'btn.home': 'Main menu',
      'alert.factionLater': 'Faction window — coming later.',
      'alert.endTurn': 'Turn passed to other factions.',
      'army.title': '⚔️ Army',
      'army.commander': '👤 Commander',
      'army.commanderName': 'Scipio Africanus',
      'army.tab.recruit': '📋 Recruit',
      'army.tab.build': '🏗️ Construction',
      'army.tab.repair': '🔧 Repair',
      'army.tab.retrain': '🔄 Retrain',
      'army.roster': '⚔️ Roster',
      'army.queue.recruit': '📋 Recruitment queue:',
      'army.buildings': '🏗️ Available buildings',
      'army.queue.build': '🏗️ Construction queue:',
      'army.repair.empty': 'Repair is available when buildings are damaged.',
      'army.retrain.empty': 'Retraining is available when units have experience.',
      'detail.close': 'Close',
      'detail.unknown': 'No data',
      'detail.unknownBadge': 'UNKNOWN',
      'detail.unknownDesc': 'No information is available for this entity yet.',
      'tech.title': '📜 Technology tree',
      'tech.close': 'Close',
      'tech.researched': '✅ Researched',
      'techDetail.research': '📚 Research',
      'techDetail.researched': '✓ Researched',
      'techDetail.researchedCost': '✅ Researched!',
      'settings.title': 'Settings',
      'settings.sound': '🎵 Sound',
      'settings.video': '🖥️ Video',
      'settings.language': '🌐 Language',
      'settings.game': '🎮 Game options',
      'settings.musicVolume': 'Music volume',
      'settings.sfxVolume': 'SFX volume',
      'settings.voiceVolume': 'Voice volume',
      'settings.resolution': 'Resolution',
      'settings.graphics': 'Graphics quality',
      'settings.uiLanguage': 'Interface language',
      'settings.lang.ru': 'Русский',
      'settings.lang.en': 'English',
      'settings.graphics.ultra': 'Ultra',
      'settings.graphics.high': 'High',
      'settings.graphics.medium': 'Medium',
      'settings.graphics.low': 'Low',
      'settings.arcade': 'Arcade battles',
      'settings.manage': 'Manage all settlements',
      'settings.trackAI': 'Track AI characters',
      'settings.back': 'Back',
      'settings.save': '💾 Save settings',
      'settings.saved': '✓ Saved!',
    },
  };

  function getLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'ru';
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang === 'en' ? 'en' : 'ru');
  }

  function t(key) {
    const lang = getLang();
    return STRINGS[lang][key] ?? STRINGS.ru[key] ?? key;
  }

  function applyEntityLabels(scope) {
    if (!window.GameContent) return;
    scope.querySelectorAll('[data-entity]').forEach((card) => {
      const id = card.getAttribute('data-entity');
      const label = card.querySelector('.card-label');
      if (label && id) label.textContent = GameContent.getEntityLabel(id);
      const alt = card.dataset.altEntity || id;
      const img = card.querySelector('img[alt]');
      if (img && alt) img.alt = GameContent.getEntityLabel(alt);
    });
  }

  function applyTechCards(scope) {
    if (!window.GameContent) return;
    scope.querySelectorAll('.tech-card[data-tech]').forEach((card) => {
      const data = GameContent.getTech(card.dataset.tech);
      if (!data) return;
      const labelEl = card.querySelector('.tech-card-label');
      const nameEl = card.querySelector('.tech-name');
      const descEl = card.querySelector('.tech-desc');
      const costEl = card.querySelector('.tech-cost');
      const unlocksEl = card.querySelector('.tech-unlocks');
      if (labelEl) labelEl.textContent = data.cardLabel;
      if (nameEl) nameEl.textContent = data.title;
      if (descEl) descEl.textContent = data.desc;
      if (costEl) {
        const researched = window.TechState
          ? TechState.isResearched(card.dataset.tech)
          : data.researched;
        costEl.textContent = researched ? t('tech.researched') : (data.cardCost || data.cost);
      }
      if (unlocksEl) unlocksEl.textContent = data.cardUnlocks || data.unlocks;
    });
  }

  function apply(root) {
    const scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.setAttribute('placeholder', t(key));
    });
    scope.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) el.setAttribute('title', t(key));
    });
    scope.querySelectorAll('[data-i18n-alt]').forEach((el) => {
      const key = el.getAttribute('data-i18n-alt');
      if (key) el.setAttribute('alt', t(key));
    });
    scope.querySelectorAll('option[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });

    const pageTitleKey = document.body && document.body.getAttribute('data-i18n-page-title');
    if (pageTitleKey) document.title = t(pageTitleKey);

    applyEntityLabels(scope);
    applyTechCards(scope);
    document.documentElement.lang = getLang();
  }

  window.GameI18n = { getLang, setLang, t, apply, applyEntityLabels, applyTechCards, STRINGS };
})();
