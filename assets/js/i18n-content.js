(function () {
  function lang() {
    return window.GameI18n ? GameI18n.getLang() : 'ru';
  }

  function pick(bilingual) {
    if (!bilingual) return '';
    if (typeof bilingual === 'string') return bilingual;
    const L = lang();
    return bilingual[L] || bilingual.ru || bilingual.en || '';
  }

  const ENTITIES = {
    legionary: {
      icon: '🛡️',
      image: '../images/leg.png',
      badgeClass: 'unit',
      ru: {
        title: 'Легионер', badge: 'ЮНИТ',
        stats: [
          { label: '⚔️ Атака', value: '14' }, { label: '🛡️ Защита', value: '18' },
          { label: '❤️ Здоровье', value: '120' }, { label: '👥 Солдат', value: '100' },
          { label: '⏳ Найм', value: '1 ход' }, { label: 'ⓓ Цена', value: '500' },
        ],
        description: 'Римский легионер — основа военной мощи Республики.<br>Тяжёлая пехота, вооружённая гладиусом и скутумом.<br>Бронзовая лорика сегментата защищает корпус.<br>Красный плащ и бронзовый шлем с гребнем — символ легиона.<br>Легионеры сражались в манипулярном строю.<br>Дисциплина и тренировки делали их непобедимыми.',
      },
      en: {
        title: 'Legionary', badge: 'UNIT',
        stats: [
          { label: '⚔️ Attack', value: '14' }, { label: '🛡️ Defense', value: '18' },
          { label: '❤️ Health', value: '120' }, { label: '👥 Soldiers', value: '100' },
          { label: '⏳ Recruit', value: '1 turn' }, { label: 'ⓓ Cost', value: '500' },
        ],
        description: 'The Roman legionary is the backbone of the Republic’s military power.<br>Heavy infantry armed with gladius and scutum.<br>Bronze lorica segmentata protects the body.<br>Red cloak and crested bronze helmet symbolize the legion.<br>Legionaries fought in manipular formation.<br>Discipline and training made them formidable.',
      },
    },
    veles: {
      icon: '🗡️', image: '../images/velit.png', badgeClass: 'unit',
      ru: {
        title: 'Велит', badge: 'ЮНИТ',
        stats: [
          { label: '⚔️ Атака', value: '8' }, { label: '🛡️ Защита', value: '6' },
          { label: '❤️ Здоровье', value: '80' }, { label: '👥 Солдат', value: '100' },
          { label: '⏳ Найм', value: '1 ход' }, { label: 'ⓓ Цена', value: '300' },
        ],
        description: 'Велиты — лёгкие застрельщики римской армии.<br>Набирались из молодых и бедных граждан.<br>Носили волчьи шкуры как отличительный знак.<br>Вооружены дротиками (пилумами) и коротким мечом.<br>Их задача — изматывать врага перед атакой тяжёлой пехоты.',
      },
      en: {
        title: 'Velite', badge: 'UNIT',
        stats: [
          { label: '⚔️ Attack', value: '8' }, { label: '🛡️ Defense', value: '6' },
          { label: '❤️ Health', value: '80' }, { label: '👥 Soldiers', value: '100' },
          { label: '⏳ Recruit', value: '1 turn' }, { label: 'ⓓ Cost', value: '300' },
        ],
        description: 'Velites are light skirmishers of the Roman army.<br>Recruited from young and poor citizens.<br>They wore wolf skins as a distinguishing mark.<br>Armed with javelins (pila) and short swords.<br>Their role was to harass the enemy before heavy infantry attacked.',
      },
    },
    equites: {
      icon: '🐴', badgeClass: 'unit',
      ru: {
        title: 'Эквиты', badge: 'ЮНИТ',
        stats: [
          { label: '⚔️ Атака', value: '18' }, { label: '🛡️ Защита', value: '12' },
          { label: '❤️ Здоровье', value: '150' }, { label: '👥 Солдат', value: '100' },
          { label: '⏳ Найм', value: '2 хода' }, { label: 'ⓓ Цена', value: '800' },
        ],
        description: 'Эквиты — римская кавалерия из всаднического сословия.<br>Использовались для фланговых ударов и разведки.<br>Сыграли ключевую роль в победах Сципиона Африканского.',
      },
      en: {
        title: 'Equites', badge: 'UNIT',
        stats: [
          { label: '⚔️ Attack', value: '18' }, { label: '🛡️ Defense', value: '12' },
          { label: '❤️ Health', value: '150' }, { label: '👥 Soldiers', value: '100' },
          { label: '⏳ Recruit', value: '2 turns' }, { label: 'ⓓ Cost', value: '800' },
        ],
        description: 'Equites are Roman cavalry from the equestrian order.<br>Used for flank attacks and reconnaissance.<br>They played a key role in Scipio Africanus’s victories.',
      },
    },
    barracks: {
      icon: '🏛️', image: '../images/building/casarmy.png', badgeClass: 'building',
      ru: {
        title: 'Казармы', badge: 'ЗДАНИЕ',
        stats: [
          { label: '⭐ Уровень', value: 'II' }, { label: '⏳ Строит.', value: '3 хода' },
          { label: 'ⓓ Цена', value: '1 200' }, { label: '👥 Гарнизон', value: '+500' },
          { label: '📋 Найм', value: '+1 слот' }, { label: '🛡️ Опыт', value: '+1 ур.' },
        ],
        description: 'Казармы (castra) — военный комплекс для размещения и обучения легионеров.<br>Строились из камня, с внутренним плацем для тренировок.<br>Ускоряют найм и повышают начальный опыт войск.',
      },
      en: {
        title: 'Barracks', badge: 'BUILDING',
        stats: [
          { label: '⭐ Level', value: 'II' }, { label: '⏳ Build', value: '3 turns' },
          { label: 'ⓓ Cost', value: '1,200' }, { label: '👥 Garrison', value: '+500' },
          { label: '📋 Recruit', value: '+1 slot' }, { label: '🛡️ XP', value: '+1 lvl' },
        ],
        description: 'Barracks (castra) house and train legionaries.<br>Built of stone with an inner drill ground.<br>They speed recruitment and raise initial unit experience.',
      },
    },
    stable: { icon: '🐴', badgeClass: 'building', ru: { title: 'Конюшни', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Конюшни позволяют содержать римскую кавалерию.' }, en: { title: 'Stables', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'Stables allow maintaining Roman cavalry.' } },
    range: { icon: '🏹', image: '../images/building/campVelit.png', badgeClass: 'building', ru: { title: 'Стрельбище', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Стрельбище улучшает подготовку метательных войск.' }, en: { title: 'Training Range', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'The range improves missile troop training.' } },
    temple: { icon: '🏛️', image: '../images/building/temple.png', badgeClass: 'civil', ru: { title: 'Храм', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Храм укрепляет религиозное влияние и порядок.' }, en: { title: 'Temple', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'The temple strengthens faith and public order.' } },
    roads: { icon: '🛣️', badgeClass: 'building', ru: { title: 'Дороги', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Римские дороги ускоряют перемещение армий.' }, en: { title: 'Roads', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'Roman roads speed up army movement.' } },
    farm: { icon: '🌾', badgeClass: 'building', ru: { title: 'Фермы', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Фермы обеспечивают продовольствием поселения.' }, en: { title: 'Farms', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'Farms supply settlements with food.' } },
    mine: { icon: '⛏️', badgeClass: 'building', ru: { title: 'Рудник', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Рудник добывает металл для армии и строительства.' }, en: { title: 'Mine', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'The mine extracts metal for army and construction.' } },
    walls: { icon: '🏰', badgeClass: 'building', ru: { title: 'Стены', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Городские стены защищают от осады.' }, en: { title: 'Walls', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'City walls protect against sieges.' } },
    market: { icon: '🏥', image: '../images/building/placeWithBuy.png', badgeClass: 'civil', ru: { title: 'Торговая площадь', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Торговая площадь оживляет рынок и улучшает снабжение.' }, en: { title: 'Market Square', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'The market square boosts trade and supply.' } },
    port: { icon: '⚓', badgeClass: 'building', ru: { title: 'Порт', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Порт развивает торговлю и флот.' }, en: { title: 'Port', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'The port develops trade and the fleet.' } },
    academy: { icon: '📜', badgeClass: 'building', ru: { title: 'Академия', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Академия повышает уровень образования элиты.' }, en: { title: 'Academy', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'The academy raises the education level of the elite.' } },
    arena: { icon: '🏟️', image: '../images/building/arena.png', badgeClass: 'civil', ru: { title: 'Арена', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Арена собирает народ на зрелища гладиаторов.' }, en: { title: 'Arena', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'The arena gathers crowds for gladiatorial games.' } },
    forge: { icon: '🛡️', badgeClass: 'building', ru: { title: 'Кузница', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Кузница улучшает оружие и доспехи.' }, en: { title: 'Forge', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'The forge improves weapons and armor.' } },
    aqueduct: { icon: '💧', badgeClass: 'building', ru: { title: 'Акведук', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Акведук снабжает город водой и повышает рост.' }, en: { title: 'Aqueduct', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'The aqueduct supplies the city with water and boosts growth.' } },
    forum: { icon: '🏛️', badgeClass: 'civil', ru: { title: 'Форум', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Форум — центр политической и торговой жизни.' }, en: { title: 'Forum', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'The forum is the center of political and commercial life.' } },
    theater: { icon: '🎭', badgeClass: 'civil', ru: { title: 'Театр', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Театр повышает культурный уровень и порядок.' }, en: { title: 'Theater', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'The theater raises culture and public order.' } },
    baths: { icon: '🛁', badgeClass: 'civil', ru: { title: 'Термы', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Термы улучшают здоровье и настроение горожан.' }, en: { title: 'Baths', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'Baths improve citizens’ health and morale.' } },
    mine2: { icon: '🏔️', badgeClass: 'building', ru: { title: 'Шахта', badge: 'ЗДАНИЕ', stats: [{ label: '⭐ Уровень', value: 'I' }], description: 'Шахта добывает камень и руду в горах.' }, en: { title: 'Quarry', badge: 'BUILDING', stats: [{ label: '⭐ Level', value: 'I' }], description: 'The quarry extracts stone and ore in the mountains.' } },

    province_northwest: {
      icon: '🗺️', badgeClass: 'civil',
      ru: {
        title: 'Северо-Запад', badge: 'ПРОВИНЦИЯ',
        stats: [
          { label: '🏙️ Город', value: 'Генуя' }, { label: '👥 Население', value: '180 тыс.' },
          { label: '💰 Доход', value: '+220' }, { label: '⚔️ Гарнизон', value: '2 когорты' },
          { label: '🌾 Еда', value: '+4' }, { label: '🛡️ Порядок', value: '72' },
        ],
        description: 'Северо-западная провинция у Альп и Лигурийского моря.<br>Торговые порты и горные перевалы дают контроль над путями в Галлию.<br>Главный город — Генуя.',
      },
      en: {
        title: 'North-West', badge: 'PROVINCE',
        stats: [
          { label: '🏙️ City', value: 'Genoa' }, { label: '👥 Population', value: '180k' },
          { label: '💰 Income', value: '+220' }, { label: '⚔️ Garrison', value: '2 cohorts' },
          { label: '🌾 Food', value: '+4' }, { label: '🛡️ Order', value: '72' },
        ],
        description: 'North-western province near the Alps and Ligurian Sea.<br>Trade ports and mountain passes control routes into Gaul.<br>Capital city — Genoa.',
      },
    },
    province_northeast: {
      icon: '🗺️', badgeClass: 'civil',
      ru: {
        title: 'Северо-Восток', badge: 'ПРОВИНЦИЯ',
        stats: [
          { label: '🏙️ Город', value: 'Венеция' }, { label: '👥 Население', value: '210 тыс.' },
          { label: '💰 Доход', value: '+260' }, { label: '⚔️ Гарнизон', value: '3 когорты' },
          { label: '🌾 Еда', value: '+6' }, { label: '🛡️ Порядок', value: '68' },
        ],
        description: 'Северо-восток Италии у Адриатики.<br>Богатые равнины По и морская торговля.<br>Главный город — Венеция.',
      },
      en: {
        title: 'North-East', badge: 'PROVINCE',
        stats: [
          { label: '🏙️ City', value: 'Venice' }, { label: '👥 Population', value: '210k' },
          { label: '💰 Income', value: '+260' }, { label: '⚔️ Garrison', value: '3 cohorts' },
          { label: '🌾 Food', value: '+6' }, { label: '🛡️ Order', value: '68' },
        ],
        description: 'North-east Italy on the Adriatic.<br>Rich Po plains and sea trade.<br>Capital city — Venice.',
      },
    },
    province_central: {
      icon: '🗺️', badgeClass: 'civil',
      ru: {
        title: 'Центр', badge: 'ПРОВИНЦИЯ',
        stats: [
          { label: '🏙️ Город', value: 'Рим' }, { label: '👥 Население', value: '450 тыс.' },
          { label: '💰 Доход', value: '+480' }, { label: '⚔️ Гарнизон', value: '5 когорт' },
          { label: '🌾 Еда', value: '+5' }, { label: '🛡️ Порядок', value: '80' },
        ],
        description: 'Центральная провинция Лациума.<br>Сердце Республики и политический центр Средиземноморья.<br>Главный город — Рим.',
      },
      en: {
        title: 'Central', badge: 'PROVINCE',
        stats: [
          { label: '🏙️ City', value: 'Rome' }, { label: '👥 Population', value: '450k' },
          { label: '💰 Income', value: '+480' }, { label: '⚔️ Garrison', value: '5 cohorts' },
          { label: '🌾 Food', value: '+5' }, { label: '🛡️ Order', value: '80' },
        ],
        description: 'Central Latium province.<br>Heart of the Republic and political center of the Mediterranean.<br>Capital city — Rome.',
      },
    },
    province_south: {
      icon: '🗺️', badgeClass: 'civil',
      ru: {
        title: 'Юг и острова', badge: 'ПРОВИНЦИЯ',
        stats: [
          { label: '🏙️ Город', value: 'Неаполь' }, { label: '👥 Население', value: '320 тыс.' },
          { label: '💰 Доход', value: '+310' }, { label: '⚔️ Гарнизон', value: '4 когорты' },
          { label: '🌾 Еда', value: '+7' }, { label: '🛡️ Порядок', value: '64' },
        ],
        description: 'Юг полуострова, Сицилия и Сардиния.<br>Хлебница Республики и ключ к морским путям.<br>Главный город — Неаполь.',
      },
      en: {
        title: 'South & Islands', badge: 'PROVINCE',
        stats: [
          { label: '🏙️ City', value: 'Naples' }, { label: '👥 Population', value: '320k' },
          { label: '💰 Income', value: '+310' }, { label: '⚔️ Garrison', value: '4 cohorts' },
          { label: '🌾 Food', value: '+7' }, { label: '🛡️ Order', value: '64' },
        ],
        description: 'Southern peninsula, Sicily and Sardinia.<br>Breadbasket of the Republic and key to sea lanes.<br>Capital city — Naples.',
      },
    },
    province_milan: {
      icon: '🗺️', badgeClass: 'civil',
      ru: {
        title: 'Провинция Милан', badge: 'ПРОВИНЦИЯ',
        stats: [
          { label: '🏙️ Город', value: 'Милан' }, { label: '👥 Население', value: '190 тыс.' },
          { label: '💰 Доход', value: '+240' }, { label: '⚔️ Гарнизон', value: '3 когорты' },
          { label: '🌾 Еда', value: '+5' }, { label: '🛡️ Порядок', value: '70' },
        ],
        description: 'Ломбардская равнина вокруг Милана.<br>Торговля, ремесло и контроль северных дорог.',
      },
      en: {
        title: 'Province of Milan', badge: 'PROVINCE',
        stats: [
          { label: '🏙️ City', value: 'Milan' }, { label: '👥 Population', value: '190k' },
          { label: '💰 Income', value: '+240' }, { label: '⚔️ Garrison', value: '3 cohorts' },
          { label: '🌾 Food', value: '+5' }, { label: '🛡️ Order', value: '70' },
        ],
        description: 'Lombard plain around Milan.<br>Trade, crafts and control of northern roads.',
      },
    },
    province_venice: {
      icon: '🗺️', badgeClass: 'civil',
      ru: {
        title: 'Провинция Венеция', badge: 'ПРОВИНЦИЯ',
        stats: [
          { label: '🏙️ Город', value: 'Венеция' }, { label: '👥 Население', value: '160 тыс.' },
          { label: '💰 Доход', value: '+280' }, { label: '⚔️ Гарнизон', value: '2 когорты' },
          { label: '🌾 Еда', value: '+3' }, { label: '🛡️ Порядок', value: '74' },
        ],
        description: 'Адриатическая провинция Венеции.<br>Морская торговля и контроль восточных путей.',
      },
      en: {
        title: 'Province of Venice', badge: 'PROVINCE',
        stats: [
          { label: '🏙️ City', value: 'Venice' }, { label: '👥 Population', value: '160k' },
          { label: '💰 Income', value: '+280' }, { label: '⚔️ Garrison', value: '2 cohorts' },
          { label: '🌾 Food', value: '+3' }, { label: '🛡️ Order', value: '74' },
        ],
        description: 'Adriatic province of Venice.<br>Sea trade and control of eastern routes.',
      },
    },
    province_genoa: {
      icon: '🗺️', badgeClass: 'civil',
      ru: {
        title: 'Провинция Генуя', badge: 'ПРОВИНЦИЯ',
        stats: [
          { label: '🏙️ Город', value: 'Генуя' }, { label: '👥 Население', value: '140 тыс.' },
          { label: '💰 Доход', value: '+250' }, { label: '⚔️ Гарнизон', value: '2 когорты' },
          { label: '🌾 Еда', value: '+2' }, { label: '🛡️ Порядок', value: '71' },
        ],
        description: 'Лигурийское побережье вокруг Генуи.<br>Порт и флот связывают север с Тирренским морем.',
      },
      en: {
        title: 'Province of Genoa', badge: 'PROVINCE',
        stats: [
          { label: '🏙️ City', value: 'Genoa' }, { label: '👥 Population', value: '140k' },
          { label: '💰 Income', value: '+250' }, { label: '⚔️ Garrison', value: '2 cohorts' },
          { label: '🌾 Food', value: '+2' }, { label: '🛡️ Order', value: '71' },
        ],
        description: 'Ligurian coast around Genoa.<br>Port and fleet link the north to the Tyrrhenian Sea.',
      },
    },
    province_rome: {
      icon: '🗺️', badgeClass: 'civil',
      ru: {
        title: 'Провинция Рим', badge: 'ПРОВИНЦИЯ',
        stats: [
          { label: '🏙️ Город', value: 'Рим' }, { label: '👥 Население', value: '450 тыс.' },
          { label: '💰 Доход', value: '+500' }, { label: '⚔️ Гарнизон', value: '6 когорт' },
          { label: '🌾 Еда', value: '+5' }, { label: '🛡️ Порядок', value: '82' },
        ],
        description: 'Лацио вокруг Вечного города.<br>Политический и военный центр Республики.',
      },
      en: {
        title: 'Province of Rome', badge: 'PROVINCE',
        stats: [
          { label: '🏙️ City', value: 'Rome' }, { label: '👥 Population', value: '450k' },
          { label: '💰 Income', value: '+500' }, { label: '⚔️ Garrison', value: '6 cohorts' },
          { label: '🌾 Food', value: '+5' }, { label: '🛡️ Order', value: '82' },
        ],
        description: 'Latium around the Eternal City.<br>Political and military center of the Republic.',
      },
    },
    province_naples: {
      icon: '🗺️', badgeClass: 'civil',
      ru: {
        title: 'Провинция Неаполь', badge: 'ПРОВИНЦИЯ',
        stats: [
          { label: '🏙️ Город', value: 'Неаполь' }, { label: '👥 Население', value: '230 тыс.' },
          { label: '💰 Доход', value: '+300' }, { label: '⚔️ Гарнизон', value: '4 когорты' },
          { label: '🌾 Еда', value: '+8' }, { label: '🛡️ Порядок', value: '66' },
        ],
        description: 'Кампания и юг полуострова вокруг Неаполя.<br>Плодородные земли и выход к южным морям.',
      },
      en: {
        title: 'Province of Naples', badge: 'PROVINCE',
        stats: [
          { label: '🏙️ City', value: 'Naples' }, { label: '👥 Population', value: '230k' },
          { label: '💰 Income', value: '+300' }, { label: '⚔️ Garrison', value: '4 cohorts' },
          { label: '🌾 Food', value: '+8' }, { label: '🛡️ Order', value: '66' },
        ],
        description: 'Campania and southern peninsula around Naples.<br>Fertile lands and access to southern seas.',
      },
    },
    province_palermo: {
      icon: '🗺️', badgeClass: 'civil',
      ru: {
        title: 'Провинция Палермо', badge: 'ПРОВИНЦИЯ',
        stats: [
          { label: '🏙️ Город', value: 'Палермо' }, { label: '👥 Население', value: '120 тыс.' },
          { label: '💰 Доход', value: '+210' }, { label: '⚔️ Гарнизон', value: '2 когорты' },
          { label: '🌾 Еда', value: '+9' }, { label: '🛡️ Порядок', value: '60' },
        ],
        description: 'Сицилия вокруг Палермо.<br>Зерно, порты и ключ к контролю Средиземноморья.',
      },
      en: {
        title: 'Province of Palermo', badge: 'PROVINCE',
        stats: [
          { label: '🏙️ City', value: 'Palermo' }, { label: '👥 Population', value: '120k' },
          { label: '💰 Income', value: '+210' }, { label: '⚔️ Garrison', value: '2 cohorts' },
          { label: '🌾 Food', value: '+9' }, { label: '🛡️ Order', value: '60' },
        ],
        description: 'Sicily around Palermo.<br>Grain, ports and the key to Mediterranean control.',
      },
    },
  };

  const TECH = {
    farming: {
      icon: '🌾', badgeClass: 'root', image: '../images/technology/RomeErth.png', researched: true,
      ru: { title: 'Земледелие', badge: 'ОСНОВА', cardLabel: 'ОСНОВА', desc: 'Освоение полей Лациума. +20% к пище.', cost: '✅ Уже изучено', unlocks: 'Открывает: Фермы, зерновые склады, амбары', cardUnlocks: 'Открывает: Фермы, склады', detail: 'Переход к оседлому земледелию стал поворотным моментом в истории Рима.<br>Осушение болот Лациума превратило поля в плодородные пашни.<br>Излишки зерна позволили содержать постоянную армию.' },
      en: { title: 'Agriculture', badge: 'FOUNDATION', cardLabel: 'FOUNDATION', desc: 'Developing the fields of Latium. +20% food.', cost: '✅ Already researched', unlocks: 'Unlocks: Farms, granaries, barns', cardUnlocks: 'Unlocks: Farms, storage', detail: 'The shift to settled agriculture was a turning point in Roman history.<br>Draining the Latium marshes turned wild fields into fertile farmland.<br>Grain surpluses allowed a standing army to be maintained.' },
    },
    tactics: {
      icon: '🛡️', badgeClass: 'military', image: '../images/technology/kogorta.jpeg', researched: false,
      ru: { title: 'Тактика легиона', badge: 'ВОЕННАЯ', cardLabel: 'ВОЕННАЯ', desc: 'Построение «черепаха» и манипулярный строй.', cost: '⏳ 3 хода | ⓓ 800', unlocks: 'Открывает: Велиты, принципы, триарии', cardUnlocks: 'Открывает: Велиты', cardCost: '⏳ 3 хода | ⓓ 800', detail: 'Манипулярный строй заменил греческую фалангу гибкой системой отрядов.<br>Легион делился на манипулы по 120 человек.<br>Построение testudo делало легион неуязвимым для стрел.' },
      en: { title: 'Legion Tactics', badge: 'MILITARY', cardLabel: 'MILITARY', desc: 'Testudo formation and manipular order.', cost: '⏳ 3 turns | ⓓ 800', unlocks: 'Unlocks: Velites, principes, triarii', cardUnlocks: 'Unlocks: Velites', cardCost: '⏳ 3 turns | ⓓ 800', detail: 'The manipular formation replaced the Greek phalanx with flexible units.<br>The legion was divided into maniples of 120 men.<br>The testudo formation made the legion nearly immune to missiles.' },
    },
    gladius: {
      icon: '⚔️', badgeClass: 'military', image: '../images/technology/gladius.png', researched: false,
      ru: { title: 'Гладиус', badge: 'ВОЕННАЯ', cardLabel: 'ВОЕННАЯ', desc: 'Короткий испанский меч для тяжёлой пехоты.', cost: '🔒 Нужна «Тактика» | 3 хода | ⓓ 1 000', unlocks: 'Открывает: Легионеров (тяжёлая пехота)', cardUnlocks: 'Открывает: Легионеры', cardCost: '🔒 Нужна «Тактика» | 3 хода | ⓓ 1 000', detail: 'Гладиус Hispaniensis — короткий меч, заимствованный у кельтиберов.<br>Идеален для ближнего боя в плотном строю.' },
      en: { title: 'Gladius', badge: 'MILITARY', cardLabel: 'MILITARY', desc: 'Short Spanish sword for heavy infantry.', cost: '🔒 Requires Tactics | 3 turns | ⓓ 1,000', unlocks: 'Unlocks: Legionaries (heavy infantry)', cardUnlocks: 'Unlocks: Legionaries', cardCost: '🔒 Requires Tactics | 3 turns | ⓓ 1,000', detail: 'The Gladius Hispaniensis was a short sword borrowed from the Celtiberians.<br>Ideal for close combat in tight formation.' },
    },
    pilum: {
      icon: '🏹', badgeClass: 'military', researched: false,
      ru: { title: 'Пилум', badge: 'ВОЕННАЯ', cardLabel: 'ВОЕННАЯ', desc: 'Тяжёлый метательный дротик.', cost: '🔒 Нужен «Гладиус» | 4 хода | ⓓ 1 500', unlocks: 'Открывает: Бросок пилума перед атакой (+ урон)', cardUnlocks: 'Открывает: Бросок перед атакой', cardCost: '🔒 Нужен «Гладиус» | 4 хода | ⓓ 1 500', detail: 'Пилум — тяжёлый метательный дротик римского легионера.<br>Залп пилумов перед атакой деморализовал врага.' },
      en: { title: 'Pilum', badge: 'MILITARY', cardLabel: 'MILITARY', desc: 'Heavy throwing javelin.', cost: '🔒 Requires Gladius | 4 turns | ⓓ 1,500', unlocks: 'Unlocks: Pilum volley before attack (+ damage)', cardUnlocks: 'Unlocks: Pre-attack volley', cardCost: '🔒 Requires Gladius | 4 turns | ⓓ 1,500', detail: 'The pilum was the heavy javelin of the Roman legionary.<br>A volley of pila before the charge demoralized the enemy.' },
    },
    cavalry: {
      icon: '🐴', badgeClass: 'military', researched: false,
      ru: { title: 'Римская конница', badge: 'ВОЕННАЯ', cardLabel: 'ВОЕННАЯ', desc: 'Обучение эквитов для фланговых ударов.', cost: '🔒 Нужен «Пилум» + «Горн» | 5 ходов | ⓓ 2 500', unlocks: 'Открывает: Эквитов (тяжёлая кавалерия)', cardUnlocks: 'Открывает: Эквиты', cardCost: '🔒 Нужен «Пилум» + «Горн» | 5 ходов | ⓓ 2 500', detail: 'Эквиты — римская кавалерия из всаднического сословия.<br>Использовалась для фланговых ударов и преследования.' },
      en: { title: 'Roman Cavalry', badge: 'MILITARY', cardLabel: 'MILITARY', desc: 'Training equites for flank attacks.', cost: '🔒 Requires Pilum + Forge | 5 turns | ⓓ 2,500', unlocks: 'Unlocks: Equites (heavy cavalry)', cardUnlocks: 'Unlocks: Equites', cardCost: '🔒 Requires Pilum + Forge | 5 turns | ⓓ 2,500', detail: 'Equites were Roman cavalry from the equestrian order.<br>Used for flank attacks and pursuit.' },
    },
    roads: {
      icon: '🛣️', badgeClass: 'peaceful', image: '../images/technology/road.png', researched: false,
      ru: { title: 'Римские дороги', badge: 'МИРНАЯ', cardLabel: 'МИРНАЯ', desc: 'Мощёные дороги. +50% к скорости армий.', cost: '⏳ 2 хода | ⓓ 600', unlocks: 'Открывает: Дороги I уровня, торговые посты', cardUnlocks: 'Открывает: Дороги I уровня', cardCost: '⏳ 2 хода | ⓓ 600', detail: 'Via Appia — первая римская дорога, проложенная в 312 BC.<br>Легионы перемещались по дорогам втрое быстрее.' },
      en: { title: 'Roman Roads', badge: 'CIVIC', cardLabel: 'CIVIC', desc: 'Paved roads. +50% army speed.', cost: '⏳ 2 turns | ⓓ 600', unlocks: 'Unlocks: Roads level I, trade posts', cardUnlocks: 'Unlocks: Roads level I', cardCost: '⏳ 2 turns | ⓓ 600', detail: 'Via Appia was the first Roman road, built in 312 BC.<br>Legions moved three times faster on paved roads.' },
    },
    masonry: {
      icon: '🏛️', badgeClass: 'peaceful', image: '../images/technology/stone.png', researched: false,
      ru: { title: 'Каменная кладка', badge: 'МИРНАЯ', cardLabel: 'МИРНАЯ', desc: 'Обработка камня и строительство из блоков.', cost: '🔒 Нужны «Дороги» | 3 хода | ⓓ 1 200', unlocks: 'Открывает: Стены, казармы, акведук', cardUnlocks: 'Открывает: Стены, казармы', cardCost: '🔒 Нужны «Дороги» | 3 хода | ⓓ 1 200', detail: 'Opus quadratum — техника кладки из тёсаных каменных блоков.<br>Каменные здания не горели при осадах.' },
      en: { title: 'Masonry', badge: 'CIVIC', cardLabel: 'CIVIC', desc: 'Stone cutting and block construction.', cost: '🔒 Requires Roads | 3 turns | ⓓ 1,200', unlocks: 'Unlocks: Walls, barracks, aqueduct', cardUnlocks: 'Unlocks: Walls, barracks', cardCost: '🔒 Requires Roads | 3 turns | ⓓ 1,200', detail: 'Opus quadratum used precisely cut stone blocks.<br>Stone buildings did not burn during sieges.' },
    },
    forge: {
      icon: '🔥', badgeClass: 'peaceful', image: '../images/technology/gorn.png', researched: false,
      ru: { title: 'Горн', badge: 'МИРНАЯ', cardLabel: 'МИРНАЯ', desc: 'Кузнечный горн для обработки металла.', cost: '🔒 Нужна «Кладка» | 3 хода | ⓓ 1 500', unlocks: 'Открывает: Кузницу, улучшение оружия', cardUnlocks: 'Открывает: Кузницу', cardCost: '🔒 Нужна «Кладка» | 3 хода | ⓓ 1 500', detail: 'Кузнечный горн — сердце римской металлургии.<br>Переход к железному оружию дал решающее преимущество.' },
      en: { title: 'Forge', badge: 'CIVIC', cardLabel: 'CIVIC', desc: 'Smithing forge for metalworking.', cost: '🔒 Requires Masonry | 3 turns | ⓓ 1,500', unlocks: 'Unlocks: Forge building, weapon upgrades', cardUnlocks: 'Unlocks: Forge', cardCost: '🔒 Requires Masonry | 3 turns | ⓓ 1,500', detail: 'The smithing forge was the heart of Roman metallurgy.<br>Iron weapons gave Rome a decisive advantage.' },
    },
    colosseum: {
      icon: '🏟️', badgeClass: 'peaceful', researched: false,
      ru: { title: 'Колизей', badge: 'МИРНАЯ', cardLabel: 'МИРНАЯ', desc: 'Великий амфитеатр. +50 к порядку.', cost: '🔒 Нужен «Горн» | 6 ходов | ⓓ 4 000', unlocks: 'Открывает: Колизей, гладиаторов', cardUnlocks: 'Открывает: Колизей', cardCost: '🔒 Нужен «Горн» | 6 ходов | ⓓ 4 000', detail: 'Амфитеатр Флавиев вмещал до 50 000 зрителей.<br>«Хлеба и зрелищ» — формула контроля над народом.' },
      en: { title: 'Colosseum', badge: 'CIVIC', cardLabel: 'CIVIC', desc: 'Great amphitheater. +50 public order.', cost: '🔒 Requires Forge | 6 turns | ⓓ 4,000', unlocks: 'Unlocks: Colosseum, gladiators', cardUnlocks: 'Unlocks: Colosseum', cardCost: '🔒 Requires Forge | 6 turns | ⓓ 4,000', detail: 'The Flavian Amphitheatre held up to 50,000 spectators.<br>“Bread and circuses” kept the populace loyal.' },
    },
  };

  const FACTIONS = {
    rome: {
      portrait: '../images/faceOfScipio.png',
      map: '../images/mapOfRome.png',
      icon: '../images/icon_rome.png',
      ru: {
        name: 'Римская республика',
        commander: 'Сципион Африканский',
        year: '270 год до н.э.',
        units: 'Тяжёлая легионерская пехота • Вспомогательные когорты союзников • Римская кавалерия • Осадные орудия',
        description: 'Римская республика — величайшая держава античного мира. Заложенная на семи холмах у берегов Тибра, она выросла из небольшого города-государства в империю, покорившую всё Средиземноморье. Железные легионы, мудрость Сената и непоколебимая вера в своё предназначение сделали Рим властелином известного мира. Но за внешним величием скрывается борьба за власть, интриги и предательства. Только тот, кто сумеет обуздать амбиции патрициев и завоевать доверие плебса, сможет привести Республику к золотому веку.',
      },
      en: {
        name: 'Roman Republic',
        commander: 'Scipio Africanus',
        year: '270 BC',
        units: 'Heavy legionary infantry • Allied auxiliary cohorts • Roman cavalry • Siege engines',
        description: 'The Roman Republic is the greatest power of the ancient world. Founded on seven hills along the Tiber, it grew from a small city-state into an empire that conquered the Mediterranean. Iron legions, Senate wisdom, and unshakable faith in destiny made Rome master of the known world. Yet behind its grandeur lie power struggles, intrigue, and betrayal. Only one who can restrain patrician ambition and win the plebs’ trust can lead the Republic to a golden age.',
      },
    },
    carthage: {
      portrait: '../images/faceOfganibal.png',
      map: '../images/mapOfCarphago.png',
      icon: '../images/icon_carthage.png',
      ru: {
        name: 'Карфаген',
        commander: 'Ганнибал Барка',
        year: '270 год до н.э.',
        units: 'Боевые слоны • Священный отряд • Отличная кавалерия • Мощный флот',
        description: 'Карфаген — город золота и слоновой кости, жемчужина Средиземноморья. Основанный финикийскими купцами, он превратился в величайшую торговую державу древнего мира. Его корабли бороздят моря от берегов Африки до Британии. Но тень Рима нависла над Карфагеном. Флот Карфагена не знает равных, а боевые слоны вселяют ужас в сердца врагов.',
      },
      en: {
        name: 'Carthage',
        commander: 'Hannibal Barca',
        year: '270 BC',
        units: 'War elephants • Sacred Band • Elite cavalry • Powerful fleet',
        description: 'Carthage is a city of gold and ivory, the pearl of the Mediterranean. Founded by Phoenician traders, it became the greatest commercial power of the ancient world. Its ships sail from Africa to Britain. But Rome’s shadow hangs over Carthage. Its fleet is unmatched and war elephants strike terror into enemy hearts.',
      },
    },
  };

  function getEntity(id) {
    const aliases = {
      velites: 'veles', hastati: 'legionary', principes: 'legionary',
      velit: 'veles', legioner: 'legionary'
    };
    const key = aliases[id] || id;
    const e = ENTITIES[key];
    if (!e) return null;
    const loc = e[lang()] || e.ru;
    return { icon: e.icon, image: e.image, badgeClass: e.badgeClass, ...loc };
  }

  function getEntityLabel(id) {
    const e = getEntity(id);
    return e ? e.title : id;
  }

  function getTech(id) {
    const t = TECH[id];
    if (!t) return null;
    const loc = t[lang()] || t.ru;
    const researched = window.TechState ? TechState.isResearched(id) : t.researched;
    return { icon: t.icon, badgeClass: t.badgeClass, image: t.image, researched, ...loc };
  }

  function getFaction(id) {
    const f = FACTIONS[id];
    if (!f) return null;
    const loc = f[lang()] || f.ru;
    return { portrait: f.portrait, map: f.map, icon: f.icon, ...loc };
  }

  window.GameContent = {
    pick,
    getEntity,
    getEntityLabel,
    getTech,
    getFaction,
    ENTITIES,
    TECH,
    FACTIONS,
  };
})();
