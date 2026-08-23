/**
 * Провинции театра Италия — Rome Remastered (wiki Provinces).
 */
(function (global) {
  'use strict';
  global.View14Provinces = [
    { id: 'cisalpina', name: 'Cisalpine Gaul', ru: 'Цизальпинская Галлия', city: 'Mediolanum', cityRu: 'Медиолан', lon: 9.19, lat: 45.46, faction: 'julii', resources: ['iron'] },
    { id: 'venetia', name: 'Venetia', ru: 'Венетия', city: 'Patavium', cityRu: 'Патавий', lon: 11.88, lat: 45.41, faction: 'julii', resources: ['glass', 'textiles'] },
    { id: 'liguria', name: 'Liguria', ru: 'Лигурия', city: 'Segesta', cityRu: 'Сегеста', lon: 8.47, lat: 44.58, faction: 'julii', resources: ['pottery', 'timber'] },
    { id: 'etruria', name: 'Etruria', ru: 'Этрурия', city: 'Arretium', cityRu: 'Арреций', lon: 11.88, lat: 43.46, faction: 'julii', resources: ['iron', 'marble'] },
    { id: 'umbria', name: 'Umbria', ru: 'Умбрия', city: 'Ariminum', cityRu: 'Аримин', lon: 12.57, lat: 44.06, faction: 'julii', resources: ['pottery'] },
    { id: 'latium', name: 'Latium', ru: 'Лаций', city: 'Rome', cityRu: 'Рим', lon: 12.48, lat: 41.89, faction: 'spqr', resources: [], capital: true },
    { id: 'campania', name: 'Campania', ru: 'Кампания', city: 'Capua', cityRu: 'Капуя', lon: 14.22, lat: 41.10, faction: 'carthage', resources: ['wine'] },
    { id: 'apulia', name: 'Apulia', ru: 'Апулия', city: 'Tarentum', cityRu: 'Тарент', lon: 17.24, lat: 40.47, faction: 'brutii', resources: ['copper', 'timber'] },
    { id: 'bruttium', name: 'Bruttium', ru: 'Бруттий', city: 'Croton', cityRu: 'Кротон', lon: 17.12, lat: 39.08, faction: 'brutii', resources: ['silver'] },
    { id: 'sic_rom', name: 'Sicilia Romanus', ru: 'Сицилия римская', city: 'Messana', cityRu: 'Мессана', lon: 15.55, lat: 38.19, faction: 'scipii', resources: [] },
    { id: 'sic_grk', name: 'Sicilia Graecus', ru: 'Сицилия греческая', city: 'Syracuse', cityRu: 'Сиракузы', lon: 15.29, lat: 37.08, faction: 'greek', resources: ['grain', 'timber'] },
    { id: 'sic_pun', name: 'Sicilia Poeni', ru: 'Сицилия пуническая', city: 'Lilybaeum', cityRu: 'Лилибей', lon: 12.43, lat: 37.80, faction: 'carthage', resources: [] },
    { id: 'sardinia', name: 'Sardinia', ru: 'Сардиния', city: 'Caralis', cityRu: 'Каралис', lon: 9.12, lat: 39.22, faction: 'carthage', resources: ['wine'] },
    { id: 'corsica', name: 'Sardinia', ru: 'Сардиния', city: '', cityRu: '', lon: 9.15, lat: 42.15, faction: 'carthage', resources: [], hidden: true },
    { id: 'dalmatia', name: 'Dalmatia', ru: 'Далмация', city: 'Salona', cityRu: 'Салона', lon: 16.48, lat: 43.54, faction: 'rebels', resources: ['gold', 'olive', 'timber'] }
  ];
  global.View14Factions = {
    spqr: { fill: [92, 48, 118], banner: '#6a3d8a', border: '#c42828', name: 'SPQR' },
    julii: { fill: [154, 48, 42], banner: '#9a3030', border: '#c42828', name: 'Julii' },
    brutii: { fill: [110, 28, 36], banner: '#7a2028', border: '#a82028', name: 'Brutii' },
    scipii: { fill: [36, 102, 98], banner: '#2a6a68', border: '#c42828', name: 'Scipii' },
    gaul: { fill: [58, 110, 52], banner: '#3a6e38', border: '#3d8c3a', name: 'Gaul' },
    rebels: { fill: [118, 104, 78], banner: '#6a5a48', border: '#b09870', name: 'Rebels' },
    greek: { fill: [186, 154, 72], banner: '#b08a38', border: '#d4a830', name: 'Greek Cities' },
    carthage: { fill: [196, 186, 158], banner: '#e8e4d8', border: '#f2efe6', name: 'Carthage' }
  };
  global.View14Roads = [
    ['Mediolanum', 'Patavium'], ['Mediolanum', 'Segesta'], ['Segesta', 'Arretium'],
    ['Arretium', 'Ariminum'], ['Arretium', 'Rome'], ['Ariminum', 'Rome'],
    ['Rome', 'Capua'], ['Capua', 'Tarentum'], ['Tarentum', 'Croton'],
    ['Croton', 'Messana'], ['Messana', 'Syracuse'], ['Syracuse', 'Lilybaeum']
  ];
})(typeof window !== 'undefined' ? window : this);
