/**
 * Build View 2 province label mask from map_underlay_1x.png (original size).
 * After changing seeds, upscale the PNG nearest-neighbour ×3 to match the HD underlay.
 * Run: node scripts/build-view2-regions.cjs
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..');
const IMG = path.join(ROOT, 'assets/images/map_underlay_1x.png');
const OUT_JS = path.join(ROOT, 'assets/maps/view2-pixel-regions.js');
const OUT_PNG = path.join(ROOT, 'assets/maps/view2-labels.png');

const SEEDS = [
  { id: 'cisalpina', name: 'Цизальпийская Галлия', x: 620, y: 170 },
  { id: 'venetia', name: 'Венетия', x: 860, y: 200 },
  { id: 'liguria', name: 'Лигурия', x: 480, y: 300 },
  { id: 'etruria', name: 'Этрурия', x: 560, y: 420 },
  { id: 'umbria', name: 'Умбрия и Пицен', x: 780, y: 450 },
  { id: 'latium', name: 'Лаций', x: 700, y: 560 },
  { id: 'campania', name: 'Кампания', x: 820, y: 720 },
  { id: 'apulia', name: 'Апулия', x: 1160, y: 780 },
  { id: 'calabria', name: 'Калабрия', x: 920, y: 960 },
  { id: 'sicilia', name: 'Сицилия', x: 900, y: 1010 },
  { id: 'sardinia', name: 'Сардиния', x: 290, y: 700 }
];

function isSea(data, W, H, x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return true;
  const i = (y * W + x) * 4;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const br = (r + g + b) / 3;
  // deep / mid ocean
  if (b > 55 && b >= g - 8 && b >= r - 5 && br < 150 && !(g > r + 18 && g > b + 8)) return true;
  // turquoise shelf
  if (r < 110 && g > 70 && b > 70 && b >= r && g >= r - 10 && br < 175 && g < 150) return true;
  return false;
}

function nearestSeed(x, y) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < SEEDS.length; i++) {
    const dx = x - SEEDS[i].x;
    const dy = y - SEEDS[i].y;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

const png = PNG.sync.read(fs.readFileSync(IMG));
const W = png.width;
const H = png.height;
const data = png.data;

const land = new Uint8Array(W * H);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    land[y * W + x] = isSea(data, W, H, x, y) ? 0 : 1;
  }
}

// Remove tiny land speckles (keep components >= 400 px)
{
  const seen = new Uint8Array(W * H);
  const qx = new Int32Array(W * H);
  const qy = new Int32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i0 = y * W + x;
      if (!land[i0] || seen[i0]) continue;
      let qs = 0;
      let qe = 0;
      qx[qe] = x;
      qy[qe] = y;
      qe++;
      seen[i0] = 1;
      const cells = [];
      while (qs < qe) {
        const cx = qx[qs];
        const cy = qy[qs];
        qs++;
        cells.push(cx, cy);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const ni = ny * W + nx;
          if (!land[ni] || seen[ni]) continue;
          seen[ni] = 1;
          qx[qe] = nx;
          qy[qe] = ny;
          qe++;
        }
      }
      if (cells.length / 2 < 400) {
        for (let k = 0; k < cells.length; k += 2) {
          land[cells[k + 1] * W + cells[k]] = 0;
        }
      }
    }
  }
}

for (const s of SEEDS) {
  if (land[s.y * W + s.x]) continue;
  let found = false;
  for (let r = 1; r < 100 && !found; r++) {
    for (let dy = -r; dy <= r && !found; dy++) {
      for (let dx = -r; dx <= r && !found; dx++) {
        const x = s.x + dx;
        const y = s.y + dy;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        if (land[y * W + x]) {
          s.x = x;
          s.y = y;
          found = true;
        }
      }
    }
  }
}

const labels = new Uint8Array(W * H); // 0 = sea, 1..N = province
const sizes = new Array(SEEDS.length).fill(0);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!land[i]) continue;
    const id = nearestSeed(x, y);
    labels[i] = id + 1;
    sizes[id]++;
  }
}

const outPng = new PNG({ width: W, height: H });
for (let i = 0; i < W * H; i++) {
  const v = labels[i];
  const o = i * 4;
  outPng.data[o] = v;
  outPng.data[o + 1] = 0;
  outPng.data[o + 2] = 0;
  outPng.data[o + 3] = v ? 255 : 0;
}
fs.writeFileSync(OUT_PNG, PNG.sync.write(outPng));

const regions = SEEDS.map((s, i) => ({
  id: s.id,
  name: s.name,
  index: i,
  size: sizes[i],
  seed: [s.x, s.y]
})).filter((r) => r.size >= 1500);

const payload = {
  width: W,
  height: H,
  labelsUrl: '/maps/view2-labels.png',
  regions
};

fs.writeFileSync(
  OUT_JS,
  '/**\n * Вид 2 — провинции по пиксельной маске подложки (не GeoJSON).\n' +
    ' * Сборка: node scripts/build-view2-regions.cjs\n */\n' +
    'window.View2PixelRegions = ' +
    JSON.stringify(payload, null, 2) +
    ';\n'
);

console.log('Wrote', OUT_JS);
console.log('Wrote', OUT_PNG);
console.log(regions.map((r) => r.id + ':' + r.size).join(', '));
