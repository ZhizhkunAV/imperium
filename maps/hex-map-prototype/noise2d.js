// Lightweight 2D value noise + FBM, deterministic via provided rng()

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function fade(t) {
  // Smoothstep-ish
  return t * t * (3 - 2 * t);
}

export function createValueNoise2D(rng, gridSize = 256) {
  // Precompute a wraparound grid of random values
  const size = gridSize;
  const grid = new Float32Array(size * size);
  for (let i = 0; i < grid.length; i++) grid[i] = rng();

  function at(ix, iy) {
    const x = ((ix % size) + size) % size;
    const y = ((iy % size) + size) % size;
    return grid[y * size + x];
  }

  return function noise(x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;

    const sx = fade(x - x0);
    const sy = fade(y - y0);

    const n00 = at(x0, y0);
    const n10 = at(x1, y0);
    const n01 = at(x0, y1);
    const n11 = at(x1, y1);

    const ix0 = lerp(n00, n10, sx);
    const ix1 = lerp(n01, n11, sx);
    return lerp(ix0, ix1, sy); // 0..1
  };
}

export function fbm2D(noiseFn, x, y, opts = {}) {
  const octaves = opts.octaves ?? 5;
  const lacunarity = opts.lacunarity ?? 2.0;
  const gain = opts.gain ?? 0.5;

  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;

  for (let i = 0; i < octaves; i++) {
    sum += amp * noiseFn(x * freq, y * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm; // 0..1
}

