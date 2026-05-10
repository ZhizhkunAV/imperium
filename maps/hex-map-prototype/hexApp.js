import { Application, Container, Graphics } from "pixi.js";
import { estimateMapPixelSize } from "./hexRender.js";
import { drawHexMap } from "./hexRender.js";
import { generateHexWorld } from "./worldGenHex.js";

const app = new Application();
await app.init({
  background: "#050505",
  antialias: false,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

document.body.appendChild(app.canvas);

function resize() {
  app.renderer.resize(window.innerWidth, window.innerHeight);
}
resize();
window.addEventListener("resize", () => {
  resize();
  centerMap();
});

const root = new Container();
app.stage.addChild(root);

const mapGfx = new Graphics();
root.addChild(mapGfx);

// Pseudo-3D / isometric tilt (visual only)
const TILT = Object.freeze({
  baseScale: 1,
  scaleY: 0.72, // compress Y to simulate perspective
  skewX: -0.35, // shear to create "tilt" impression
});

root.skew.x = TILT.skewX;
root.scale.set(TILT.baseScale, TILT.baseScale * TILT.scaleY);

let currentSeed = "rome-001";
let isDragging = false;
let last = { x: 0, y: 0 };

const seedInput = document.getElementById("seedInput");
const regenBtn = document.getElementById("regenBtn");
const statsEl = document.getElementById("stats");

function applySeed(newSeed) {
  currentSeed = newSeed;
  seedInput.value = newSeed;

  const { tiles, stats } = generateHexWorld(newSeed);
  drawHexMap(mapGfx, tiles);

  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  statsEl.textContent = `sea ${pct(stats.sea, total)} | plains ${pct(stats.plains, total)} | forest ${pct(
    stats.forest,
    total
  )} | mtn ${pct(stats.mountains, total)} | snow ${pct(stats.snow, total)}`;

  centerMap();
}

function pct(v, total) {
  return `${Math.round((100 * v) / total)}%`;
}

function centerMap() {
  const { w, h } = estimateMapPixelSize();
  root.x = Math.floor((app.renderer.width - w * root.scale.x) / 2);
  root.y = Math.floor((app.renderer.height - h * root.scale.y) / 2);
}

regenBtn.addEventListener("click", () => applySeed(seedInput.value.trim() || "rome-001"));
seedInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") applySeed(seedInput.value.trim() || "rome-001");
});

// Pan (mouse drag)
app.canvas.addEventListener("mousedown", (e) => {
  isDragging = true;
  last = { x: e.clientX, y: e.clientY };
});
window.addEventListener("mouseup", () => (isDragging = false));
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const dx = e.clientX - last.x;
  const dy = e.clientY - last.y;
  last = { x: e.clientX, y: e.clientY };
  root.x += dx;
  root.y += dy;
});

// Zoom (wheel)
app.canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    const next = Math.max(0.4, Math.min(2.5, root.scale.x * factor));
    root.scale.set(next, next * TILT.scaleY);
  },
  { passive: false }
);

applySeed(currentSeed);

