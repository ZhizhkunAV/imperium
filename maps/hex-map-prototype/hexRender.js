import { Graphics } from "pixi.js";
import { HEX_SIZE, MAP_COLS, MAP_ROWS, OUTLINE } from "./hexSpec.js";
import { tileColor } from "./worldGenHex.js";

// Pointy-top hex geometry
const SQRT3 = Math.sqrt(3);

export function hexToPixel(col, row) {
  const x = HEX_SIZE * SQRT3 * (col + (row & 1) * 0.5);
  const y = HEX_SIZE * 1.5 * row;
  return { x, y };
}

export function hexPolygonPoints(cx, cy) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30); // pointy-top
    pts.push(cx + HEX_SIZE * Math.cos(angle), cy + HEX_SIZE * Math.sin(angle));
  }
  return pts;
}

export function estimateMapPixelSize() {
  // approximate extents for centering
  const last = hexToPixel(MAP_COLS - 1, MAP_ROWS - 1);
  const w = last.x + HEX_SIZE * SQRT3;
  const h = last.y + HEX_SIZE * 2;
  return { w, h };
}

export function drawHexMap(containerGfx, tiles) {
  containerGfx.clear();

  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const { x, y } = hexToPixel(col, row);
      const pts = hexPolygonPoints(x, y);
      const c = tileColor(tiles[row][col]);

      containerGfx.poly(pts).fill({ color: c });
      containerGfx.poly(pts).stroke({ color: OUTLINE.color, width: OUTLINE.width, alpha: OUTLINE.alpha });
    }
  }
}

