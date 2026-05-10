import { COLORS, MAP_H, MAP_W } from "./mapSpec.js";

/**
 * Tile legend:
 * S sea, P plains, M mountains, F forest, B beach, A alps(snow mountains)
 */
export const TILE = Object.freeze({
  Sea: "S",
  Plains: "P",
  Mountains: "M",
  Forest: "F",
  Beach: "B",
  Snow: "A",
});

export function tileToColor(tile) {
  switch (tile) {
    case TILE.Sea:
      return COLORS.sea;
    case TILE.Plains:
      return COLORS.plains;
    case TILE.Mountains:
      return COLORS.mountains;
    case TILE.Forest:
      return COLORS.forest;
    case TILE.Beach:
      return COLORS.beach;
    case TILE.Snow:
      return COLORS.snow;
    default:
      return 0xff00ff;
  }
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

function setRect(grid, x0, y0, x1, y1, tile) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (inBounds(x, y)) grid[y][x] = tile;
    }
  }
}

function setPoint(grid, x, y, tile) {
  if (inBounds(x, y)) grid[y][x] = tile;
}

function neighbors4(x, y) {
  return [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];
}

function addBeaches(grid) {
  // Beach = land cell adjacent to sea
  const next = grid.map((row) => row.slice());
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const t = grid[y][x];
      if (t === TILE.Sea || t === TILE.Snow || t === TILE.Mountains) continue;
      const nearSea = neighbors4(x, y).some(([nx, ny]) => inBounds(nx, ny) && grid[ny][nx] === TILE.Sea);
      if (nearSea) next[y][x] = TILE.Beach;
    }
  }
  // Do not turn forests into beaches; keep beaches only on plains.
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (grid[y][x] === TILE.Forest && next[y][x] === TILE.Beach) next[y][x] = TILE.Forest;
    }
  }
  return next;
}

function carveRiver(grid, points) {
  // River is drawn as sea-color 1 tile wide (as requested "blue line")
  for (const [x, y] of points) {
    setPoint(grid, x, y, TILE.Sea);
  }
}

export function generateWorld() {
  // Start with all sea
  const grid = Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => TILE.Sea));

  // === NORTH AFRICA (rows 32-49, 0-based) ===
  // wide land band (Tunisia)
  setRect(grid, 5, 41, 64, 49, TILE.Plains); // rows 42-50 in 1-based terms
  setRect(grid, 8, 31, 60, 40, TILE.Plains); // rows 32-41

  // West: more arid (still plains; beaches will add yellow)
  setRect(grid, 5, 41, 20, 49, TILE.Plains);

  // Cap Bon peninsula (rows ~36-41, cols ~28-34)
  setRect(grid, 24, 35, 34, 40, TILE.Plains);
  setRect(grid, 30, 34, 36, 38, TILE.Plains); // protrude a bit into sea

  // "South of Carthage" mountains patches (few grey tiles)
  setRect(grid, 26, 40, 29, 42, TILE.Mountains);
  setRect(grid, 30, 41, 32, 43, TILE.Mountains);

  // Carthage marker position (kept as plains tile; no text)
  setPoint(grid, 28, 37, TILE.Plains); // ~col 28 row 38 (1-based)

  // === ITALY (boot shape) ===
  // Alps rows 3-6 (1-based) => y=2..5; cols 25-42
  setRect(grid, 24, 2, 41, 5, TILE.Snow);
  // Turin near Alps (col 26 row 6 => x=25,y=5) keep snow border around but city itself plain
  setPoint(grid, 25, 5, TILE.Plains);

  // Main Italian landmass (approx boot)
  // North Italy (rows 7-11 => y=6..10)
  setRect(grid, 24, 6, 41, 10, TILE.Plains);
  // Central Italy (rows 12-16 => y=11..15)
  setRect(grid, 26, 11, 40, 15, TILE.Plains);
  // South Italy (rows 17-20 => y=16..19) and toe
  setRect(grid, 29, 16, 41, 19, TILE.Plains);
  setRect(grid, 37, 18, 42, 21, TILE.Plains); // toe

  // carve "boot" west coast taper by removing some plains back to sea
  setRect(grid, 24, 11, 25, 15, TILE.Sea);
  setRect(grid, 24, 16, 27, 19, TILE.Sea);
  setRect(grid, 28, 20, 32, 21, TILE.Sea);

  // forests patches in rows 7-20 (y=6..19)
  setRect(grid, 30, 8, 33, 10, TILE.Forest);
  setRect(grid, 35, 12, 37, 13, TILE.Forest);
  setRect(grid, 31, 15, 33, 16, TILE.Forest);

  // East coast cliffs: sprinkle mountains along right edge of boot
  setRect(grid, 41, 11, 41, 14, TILE.Mountains);
  setRect(grid, 40, 15, 41, 16, TILE.Mountains);

  // Cities as plains (no markers/text)
  setPoint(grid, 31, 9, TILE.Plains); // Rome x=32,y=10 => 0-based
  setPoint(grid, 33, 13, TILE.Plains); // Capua x=34,y=14
  setPoint(grid, 39, 15, TILE.Plains); // Tarent x=40,y=16

  // === SICILY (cols 32-40 rows 24-30 => x=31..39,y=23..29) triangular-ish ===
  for (let y = 23; y <= 29; y++) {
    const span = y - 23; // 0..6
    const xStart = 31 + Math.max(0, 2 - Math.floor(span / 2));
    const xEnd = 39 - Math.max(0, 1 - Math.floor(span / 3));
    setRect(grid, xStart, y, xEnd, y, TILE.Plains);
  }
  // Sicily NE mountains
  setRect(grid, 38, 23, 39, 25, TILE.Mountains);
  // Syracuse ~ col 38 row 28 => x=37,y=27 keep plains
  setPoint(grid, 37, 27, TILE.Plains);

  // Egadi islands near west Sicily (col 30 row 28 => x=29,y=27) 2-3 tiles
  setPoint(grid, 29, 27, TILE.Plains);
  setPoint(grid, 30, 28, TILE.Plains);
  setPoint(grid, 28, 28, TILE.Plains);

  // Malta (col 36 row 32 => x=35,y=31) tiny tile with beach added later
  setPoint(grid, 35, 31, TILE.Plains);

  // === SARDINIA (cols 10-18 rows 18-24 => x=9..17,y=17..23) elongated ===
  for (let y = 17; y <= 23; y++) {
    const dx = Math.abs(20 - (y + 1)); // small variance
    setRect(grid, 9 + Math.floor(dx / 3), y, 17 - Math.floor(dx / 4), y, TILE.Plains);
  }
  // Sardinia mountains center
  setRect(grid, 12, 19, 14, 21, TILE.Mountains);

  // Corsica above Sardinia (cols 14-18 rows 14-16 => x=13..17,y=13..15)
  setRect(grid, 13, 13, 16, 15, TILE.Plains);
  setRect(grid, 14, 14, 15, 14, TILE.Mountains);

  // === STRAITS (ensure sea gaps) ===
  // Strait between Sicily and Italy (1-2 sea tiles)
  setRect(grid, 35, 21, 38, 22, TILE.Sea);
  // Strait between Sicily and Tunisia (2-3 sea tiles)
  setRect(grid, 33, 30, 38, 31, TILE.Sea);

  // === RIVERS ===
  // Tiber through Rome to west sea (simple 2-tile line)
  carveRiver(grid, [
    [31, 9], // through Rome
    [30, 10],
    [29, 11],
  ]);
  // Po river north Italy to Adriatic (right)
  carveRiver(grid, [
    [28, 7],
    [30, 7],
    [32, 7],
    [34, 7],
    [36, 7],
    [38, 8],
    [40, 9],
  ]);

  // Add beaches as coast transition
  const withBeaches = addBeaches(grid);

  return withBeaches;
}

