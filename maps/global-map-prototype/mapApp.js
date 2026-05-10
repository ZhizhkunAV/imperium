import { Application, Graphics } from "pixi.js";
import { GRID_STROKE, MAP_H, MAP_W } from "./mapSpec.js";
import { generateWorld, tileToColor } from "./worldGen.js";

const TILE_SIZE = 12; // pixels per square
const STROKE_W = 1;

const app = new Application();
await app.init({
  background: "#000000",
  antialias: false,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

document.body.appendChild(app.canvas);

function resizeToFit() {
  const pad = 0;
  app.renderer.resize(window.innerWidth - pad, window.innerHeight - pad);
}
resizeToFit();
window.addEventListener("resize", resizeToFit);

const world = generateWorld(); // 50 rows × 70 cols

const mapGfx = new Graphics();
app.stage.addChild(mapGfx);

function draw() {
  mapGfx.clear();

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const c = tileToColor(world[y][x]);
      mapGfx
        .rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        .fill({ color: c });
      mapGfx
        .rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        .stroke({ color: GRID_STROKE, width: STROKE_W, alpha: 1 });
    }
  }

  // Center map
  const mapW = MAP_W * TILE_SIZE;
  const mapH = MAP_H * TILE_SIZE;
  mapGfx.x = Math.floor((app.renderer.width - mapW) / 2);
  mapGfx.y = Math.floor((app.renderer.height - mapH) / 2);
}

draw();

