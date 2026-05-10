import { COLORS, MAP_COLS, MAP_ROWS } from "./hexSpec.js";
import { createValueNoise2D, fbm2D } from "./noise2d.js";
import { mulberry32, xmur3 } from "./random.js";

export const TILE = Object.freeze({
  Sea: "sea",
  Beach: "beach",
  Plains: "plains",
  Forest: "forest",
  Mountains: "mountains",
  Snow: "snow",
});

export function tileColor(tile) {
  return COLORS[tile] ?? 0xff00ff;
}

function inBounds(c, r) {
  return c >= 0 && r >= 0 && c < MAP_COLS && r < MAP_ROWS;
}

// odd-r neighbors for pointy hex
function neighbors6(c, r) {
  const odd = r & 1;
  // Based on redblobgames (odd-r)
  const deltas = odd
    ? [
        [-1, 0],
        [1, 0],
        [0, -1],
        [1, -1],
        [0, 1],
        [1, 1],
      ]
    : [
        [-1, 0],
        [1, 0],
        [-1, -1],
        [0, -1],
        [-1, 1],
        [0, 1],
      ];
  return deltas.map(([dc, dr]) => [c + dc, r + dr]).filter(([nc, nr]) => inBounds(nc, nr));
}

function addBeaches(tiles) {
  const out = tiles.map((row) => row.slice());
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      const t = tiles[r][c];
      if (t === TILE.Sea || t === TILE.Mountains || t === TILE.Snow) continue;
      const nearSea = neighbors6(c, r).some(([nc, nr]) => tiles[nr][nc] === TILE.Sea);
      if (nearSea) out[r][c] = TILE.Beach;
    }
  }
  // keep forests as forests even on coast
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (tiles[r][c] === TILE.Forest && out[r][c] === TILE.Beach) out[r][c] = TILE.Forest;
    }
  }
  return out;
}

export function generateHexWorld(seedStr) {
  const seedFn = xmur3(seedStr);
  const rng = mulberry32(seedFn());
  const n = createValueNoise2D(rng, 256);

  const tiles = Array.from({ length: MAP_ROWS }, () => Array.from({ length: MAP_COLS }, () => TILE.Sea));

  // Noise scales
  const elevScale = 0.08;
  const moistScale = 0.09;

  // Island / continent shaping (radial falloff)
  const cx = (MAP_COLS - 1) / 2;
  const cy = (MAP_ROWS - 1) / 2;
  const maxD = Math.hypot(cx, cy);

  const stats = {
    sea: 0,
    beach: 0,
    plains: 0,
    forest: 0,
    mountains: 0,
    snow: 0,
  };

  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      // offset coords -> continuous space
      const x = c + (r & 1) * 0.5;
      const y = r;

      const e0 = fbm2D(n, x * elevScale, y * elevScale, { octaves: 6, gain: 0.52 });
      const m0 = fbm2D(n, x * moistScale + 100, y * moistScale + 100, { octaves: 5, gain: 0.5 });

      // radial: keep more land in the center
      const d = Math.hypot(c - cx, r - cy) / maxD;
      const falloff = 1 - Math.pow(d, 1.8);
      const elev = e0 * 0.72 + falloff * 0.28;
      const moist = m0;

      let t;
      if (elev < 0.42) t = TILE.Sea;
      else if (elev < 0.55) t = TILE.Plains;
      else if (elev < 0.68) t = moist > 0.55 ? TILE.Forest : TILE.Plains;
      else if (elev < 0.82) t = TILE.Mountains;
      else t = TILE.Snow;

      tiles[r][c] = t;
    }
  }

  const withBeaches = addBeaches(tiles);

  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      stats[withBeaches[r][c]]++;
    }
  }

  return { tiles: withBeaches, stats };
}

