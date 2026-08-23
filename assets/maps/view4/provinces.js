/**
 * Вид 4 — независимая копия вида 2. Правки в /maps/view4 не затрагивают вид 2.
 * Координаты в пространстве 4086×3465 (исходная карта ×3).
 * Сборка маски: node scripts/build-view2-regions.cjs  (по map_underlay_1x.png, затем увеличить nearest ×3)
 */
window.View4PixelRegions = {
  "width": 4086,
  "height": 3465,
  "labelsUrl": "/maps/view4/labels.png",
  "regions": [
    {
      "id": "cisalpina",
      "name": "Цизальпийская Галлия",
      "index": 0,
      "size": 466785,
      "seed": [
        1860,
        510
      ]
    },
    {
      "id": "venetia",
      "name": "Венетия",
      "index": 1,
      "size": 206208,
      "seed": [
        2418,
        438
      ]
    },
    {
      "id": "liguria",
      "name": "Лигурия",
      "index": 2,
      "size": 896580,
      "seed": [
        1440,
        900
      ]
    },
    {
      "id": "etruria",
      "name": "Этрурия",
      "index": 3,
      "size": 240903,
      "seed": [
        1680,
        1260
      ]
    },
    {
      "id": "umbria",
      "name": "Умбрия и Пицен",
      "index": 4,
      "size": 326439,
      "seed": [
        2340,
        1350
      ]
    },
    {
      "id": "latium",
      "name": "Лаций",
      "index": 5,
      "size": 120888,
      "seed": [
        2100,
        1680
      ]
    },
    {
      "id": "campania",
      "name": "Кампания",
      "index": 6,
      "size": 335718,
      "seed": [
        2637,
        1989
      ]
    },
    {
      "id": "apulia",
      "name": "Апулия",
      "index": 7,
      "size": 337887,
      "seed": [
        3480,
        2340
      ]
    },
    {
      "id": "calabria",
      "name": "Калабрия",
      "index": 8,
      "size": 115380,
      "seed": [
        2760,
        2880
      ]
    },
    {
      "id": "sicilia",
      "name": "Сицилия",
      "index": 9,
      "size": 238653,
      "seed": [
        2700,
        3030
      ]
    },
    {
      "id": "sardinia",
      "name": "Сардиния",
      "index": 10,
      "size": 256725,
      "seed": [
        870,
        2100
      ]
    }
  ]
};
