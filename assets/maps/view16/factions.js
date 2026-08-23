/**
 * Вид 16 — Medieval II Total War–inspired theater (Western Europe / Mediterranean).
 * Historically inspired recreation only — not CA assets.
 */
(function (global) {
  'use strict';

  global.View16Factions = {
    england: { fill: [180, 36, 42], banner: '#b4242a', border: '#e8c878', name: 'England', ru: 'Англия' },
    france: { fill: [42, 72, 148], banner: '#2a4894', border: '#c8d8f0', name: 'France', ru: 'Франция' },
    hre: { fill: [62, 62, 72], banner: '#3e3e48', border: '#d4a820', name: 'Holy Roman Empire', ru: 'СРИ' },
    venice: { fill: [168, 48, 58], banner: '#a8303a', border: '#f0d090', name: 'Venice', ru: 'Венеция' },
    milan: { fill: [48, 98, 72], banner: '#306248', border: '#c8e0c0', name: 'Milan', ru: 'Милан' },
    papal: { fill: [236, 232, 220], banner: '#ece8dc', border: '#c42828', name: 'Papal States', ru: 'Папская область' },
    sicily: { fill: [36, 92, 108], banner: '#245c6c', border: '#a8d0e0', name: 'Sicily', ru: 'Сицилия' },
    spain: { fill: [196, 148, 42], banner: '#c4942a', border: '#f0e0a0', name: 'Spain', ru: 'Испания' },
    moors: { fill: [36, 110, 72], banner: '#246e48', border: '#d0e8c8', name: 'Moors', ru: 'Мавры' },
    byzantium: { fill: [72, 48, 118], banner: '#483076', border: '#e0c878', name: 'Byzantium', ru: 'Византия' },
    scotland: { fill: [48, 72, 128], banner: '#304880', border: '#c0d0e8', name: 'Scotland', ru: 'Шотландия' },
    rebels: { fill: [118, 104, 78], banner: '#6a5a48', border: '#b09870', name: 'Rebels', ru: 'Повстанцы' }
  };

  global.View16Provinces = [
    /* England */
    { id: 'london', name: 'London', ru: 'Лондон', city: 'London', cityRu: 'Лондон', lon: -0.12, lat: 51.50, faction: 'england', capital: true, resources: ['grain', 'textiles'] },
    { id: 'nottingham', name: 'Nottingham', ru: 'Ноттингем', city: 'Nottingham', cityRu: 'Ноттингем', lon: -1.15, lat: 52.95, faction: 'england', resources: ['iron', 'timber'] },
    { id: 'york', name: 'York', ru: 'Йорк', city: 'York', cityRu: 'Йорк', lon: -1.08, lat: 53.96, faction: 'england', resources: ['textiles'] },
    { id: 'caernarvon', name: 'Caernarvon', ru: 'Карнарвон', city: 'Caernarvon', cityRu: 'Карнарвон', lon: -4.27, lat: 53.14, faction: 'england', resources: ['timber'] },

    /* Scotland */
    { id: 'edinburgh', name: 'Edinburgh', ru: 'Эдинбург', city: 'Edinburgh', cityRu: 'Эдинбург', lon: -3.19, lat: 55.95, faction: 'scotland', capital: true, resources: ['timber'] },
    { id: 'inverness', name: 'Inverness', ru: 'Инвернесс', city: 'Inverness', cityRu: 'Инвернесс', lon: -4.22, lat: 57.48, faction: 'scotland', resources: ['timber'] },

    /* France */
    { id: 'paris', name: 'Paris', ru: 'Париж', city: 'Paris', cityRu: 'Париж', lon: 2.35, lat: 48.86, faction: 'france', capital: true, resources: ['grain', 'wine'] },
    { id: 'rheims', name: 'Rheims', ru: 'Реймс', city: 'Rheims', cityRu: 'Реймс', lon: 4.03, lat: 49.26, faction: 'france', resources: ['wine'] },
    { id: 'angers', name: 'Angers', ru: 'Анже', city: 'Angers', cityRu: 'Анже', lon: -0.55, lat: 47.47, faction: 'france', resources: ['grain'] },
    { id: 'toulouse', name: 'Toulouse', ru: 'Тулуза', city: 'Toulouse', cityRu: 'Тулуза', lon: 1.44, lat: 43.60, faction: 'france', resources: ['wine'] },
    { id: 'marseille', name: 'Marseille', ru: 'Марсель', city: 'Marseille', cityRu: 'Марсель', lon: 5.37, lat: 43.30, faction: 'france', resources: ['olive', 'wine'] },
    { id: 'bordeaux', name: 'Bordeaux', ru: 'Бордо', city: 'Bordeaux', cityRu: 'Бордо', lon: -0.58, lat: 44.84, faction: 'france', resources: ['wine'] },

    /* HRE */
    { id: 'frankfurt', name: 'Frankfurt', ru: 'Франкфурт', city: 'Frankfurt', cityRu: 'Франкфурт', lon: 8.68, lat: 50.11, faction: 'hre', capital: true, resources: ['iron', 'textiles'] },
    { id: 'nuremberg', name: 'Nuremberg', ru: 'Нюрнберг', city: 'Nuremberg', cityRu: 'Нюрнберг', lon: 11.08, lat: 49.45, faction: 'hre', resources: ['iron'] },
    { id: 'vienna', name: 'Vienna', ru: 'Вена', city: 'Vienna', cityRu: 'Вена', lon: 16.37, lat: 48.21, faction: 'hre', resources: ['grain'] },
    { id: 'prague', name: 'Prague', ru: 'Прага', city: 'Prague', cityRu: 'Прага', lon: 14.42, lat: 50.08, faction: 'hre', resources: ['silver'] },
    { id: 'staufen', name: 'Staufen', ru: 'Штауфен', city: 'Staufen', cityRu: 'Штауфен', lon: 7.85, lat: 47.88, faction: 'hre', resources: ['timber'] },
    { id: 'innsbruck', name: 'Innsbruck', ru: 'Инсбрук', city: 'Innsbruck', cityRu: 'Инсбрук', lon: 11.39, lat: 47.27, faction: 'hre', resources: ['iron'] },

    /* Milan / Northern Italy */
    { id: 'milan', name: 'Milan', ru: 'Милан', city: 'Milan', cityRu: 'Милан', lon: 9.19, lat: 45.46, faction: 'milan', capital: true, resources: ['iron', 'textiles'] },
    { id: 'genoa', name: 'Genoa', ru: 'Генуя', city: 'Genoa', cityRu: 'Генуя', lon: 8.95, lat: 44.41, faction: 'milan', resources: ['glass'] },
    { id: 'florence', name: 'Florence', ru: 'Флоренция', city: 'Florence', cityRu: 'Флоренция', lon: 11.26, lat: 43.77, faction: 'milan', resources: ['textiles'] },

    /* Venice */
    { id: 'venice', name: 'Venice', ru: 'Венеция', city: 'Venice', cityRu: 'Венеция', lon: 12.34, lat: 45.44, faction: 'venice', capital: true, resources: ['glass', 'textiles'] },
    { id: 'zagreb', name: 'Zagreb', ru: 'Загреб', city: 'Zagreb', cityRu: 'Загреб', lon: 15.98, lat: 45.81, faction: 'venice', resources: ['timber'] },
    { id: 'ragusa', name: 'Ragusa', ru: 'Рагуза', city: 'Ragusa', cityRu: 'Рагуза', lon: 18.09, lat: 42.65, faction: 'venice', resources: ['olive'] },

    /* Papal States */
    { id: 'rome', name: 'Rome', ru: 'Рим', city: 'Rome', cityRu: 'Рим', lon: 12.48, lat: 41.89, faction: 'papal', capital: true, resources: [] },
    { id: 'ancona', name: 'Ancona', ru: 'Анкона', city: 'Ancona', cityRu: 'Анкона', lon: 13.52, lat: 43.62, faction: 'papal', resources: ['pottery'] },
    { id: 'bologna', name: 'Bologna', ru: 'Болонья', city: 'Bologna', cityRu: 'Болонья', lon: 11.34, lat: 44.49, faction: 'papal', resources: ['grain'] },

    /* Sicily */
    { id: 'naples', name: 'Naples', ru: 'Неаполь', city: 'Naples', cityRu: 'Неаполь', lon: 14.25, lat: 40.85, faction: 'sicily', capital: true, resources: ['wine'] },
    { id: 'palermo', name: 'Palermo', ru: 'Палермо', city: 'Palermo', cityRu: 'Палермо', lon: 13.36, lat: 38.12, faction: 'sicily', resources: ['grain'] },
    { id: 'syracuse', name: 'Syracuse', ru: 'Сиракузы', city: 'Syracuse', cityRu: 'Сиракузы', lon: 15.29, lat: 37.08, faction: 'sicily', resources: ['olive'] },

    /* Spain */
    { id: 'toledo', name: 'Toledo', ru: 'Толедо', city: 'Toledo', cityRu: 'Толедо', lon: -4.02, lat: 39.86, faction: 'spain', capital: true, resources: ['iron', 'textiles'] },
    { id: 'leon', name: 'Leon', ru: 'Леон', city: 'Leon', cityRu: 'Леон', lon: -5.57, lat: 42.60, faction: 'spain', resources: ['grain'] },
    { id: 'valencia', name: 'Valencia', ru: 'Валенсия', city: 'Valencia', cityRu: 'Валенсия', lon: -0.38, lat: 39.47, faction: 'spain', resources: ['olive', 'wine'] },
    { id: 'barcelona', name: 'Barcelona', ru: 'Барселона', city: 'Barcelona', cityRu: 'Барселона', lon: 2.17, lat: 41.39, faction: 'spain', resources: ['textiles'] },

    /* Moors */
    { id: 'cordoba', name: 'Cordoba', ru: 'Кордова', city: 'Cordoba', cityRu: 'Кордова', lon: -4.78, lat: 37.89, faction: 'moors', capital: true, resources: ['olive', 'grain'] },
    { id: 'granada', name: 'Granada', ru: 'Гранада', city: 'Granada', cityRu: 'Гранада', lon: -3.60, lat: 37.18, faction: 'moors', resources: ['silver'] },
    { id: 'marrakesh', name: 'Marrakesh', ru: 'Марракеш', city: 'Marrakesh', cityRu: 'Марракеш', lon: -7.98, lat: 31.63, faction: 'moors', resources: ['gold'] },
    { id: 'algiers', name: 'Algiers', ru: 'Алжир', city: 'Algiers', cityRu: 'Алжир', lon: 3.06, lat: 36.75, faction: 'moors', resources: ['pottery'] },

    /* Byzantium fringe */
    { id: 'constantinople', name: 'Constantinople', ru: 'Константинополь', city: 'Constantinople', cityRu: 'Константинополь', lon: 28.98, lat: 41.01, faction: 'byzantium', capital: true, resources: ['gold', 'glass', 'textiles'] },
    { id: 'thessalonica', name: 'Thessalonica', ru: 'Фессалоники', city: 'Thessalonica', cityRu: 'Фессалоники', lon: 22.94, lat: 40.64, faction: 'byzantium', resources: ['olive'] },
    { id: 'durazzo', name: 'Durazzo', ru: 'Дураццо', city: 'Durazzo', cityRu: 'Дураццо', lon: 19.45, lat: 41.32, faction: 'byzantium', resources: ['timber'] },

    /* Independent / rebels */
    { id: 'budapest', name: 'Budapest', ru: 'Будапешт', city: 'Budapest', cityRu: 'Будапешт', lon: 19.04, lat: 47.50, faction: 'rebels', resources: ['grain'] },
    { id: 'krakow', name: 'Krakow', ru: 'Краков', city: 'Krakow', cityRu: 'Краков', lon: 19.94, lat: 50.06, faction: 'rebels', resources: ['silver', 'timber'] },
    { id: 'lisbon', name: 'Lisbon', ru: 'Лиссабон', city: 'Lisbon', cityRu: 'Лиссабон', lon: -9.14, lat: 38.72, faction: 'rebels', resources: ['wine'] }
  ];

  global.View16Roads = [
    /* Britain */
    ['London', 'Nottingham'], ['Nottingham', 'York'], ['London', 'Caernarvon'],
    ['Edinburgh', 'York'], ['Edinburgh', 'Inverness'],
    /* France */
    ['Paris', 'Rheims'], ['Paris', 'Angers'], ['Paris', 'Bordeaux'],
    ['Angers', 'Bordeaux'], ['Bordeaux', 'Toulouse'], ['Toulouse', 'Marseille'],
    ['Paris', 'Marseille'], ['Rheims', 'Frankfurt'],
    /* Cross-Channel / Low Countries */
    ['London', 'Paris'], ['London', 'Angers'],
    /* HRE */
    ['Frankfurt', 'Nuremberg'], ['Nuremberg', 'Prague'], ['Nuremberg', 'Vienna'],
    ['Frankfurt', 'Staufen'], ['Staufen', 'Milan'], ['Vienna', 'Budapest'],
    ['Prague', 'Krakow'], ['Innsbruck', 'Milan'], ['Innsbruck', 'Vienna'],
    ['Nuremberg', 'Innsbruck'],
    /* Italy */
    ['Milan', 'Genoa'], ['Milan', 'Venice'], ['Milan', 'Florence'],
    ['Florence', 'Bologna'], ['Bologna', 'Venice'], ['Bologna', 'Ancona'],
    ['Ancona', 'Rome'], ['Florence', 'Rome'], ['Rome', 'Naples'],
    ['Naples', 'Palermo'], ['Palermo', 'Syracuse'],
    ['Venice', 'Zagreb'], ['Zagreb', 'Ragusa'], ['Ragusa', 'Durazzo'],
    /* Iberia / Maghreb */
    ['Toledo', 'Leon'], ['Toledo', 'Valencia'], ['Toledo', 'Cordoba'],
    ['Valencia', 'Barcelona'], ['Barcelona', 'Toulouse'], ['Barcelona', 'Marseille'],
    ['Cordoba', 'Granada'], ['Cordoba', 'Lisbon'], ['Leon', 'Bordeaux'],
    ['Granada', 'Marrakesh'], ['Cordoba', 'Algiers'], ['Algiers', 'Marseille'],
    /* Balkans / Byzantium */
    ['Budapest', 'Vienna'], ['Durazzo', 'Thessalonica'],
    ['Thessalonica', 'Constantinople'], ['Ragusa', 'Thessalonica']
  ];
})(typeof window !== 'undefined' ? window : this);
