/**
 * Layered canvas fog. Three bands of value noise drift at different speeds (parallax),
 * densest near the ground. Rendered at a very low resolution and scaled up with smoothing,
 * capped at about 20 frames per second, paused when hidden and drawn once when motion is reduced.
 */

/** Deterministic hash of an integer lattice point to [0, 1). */
export function hash2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Smoothly interpolated value noise in [0, 1). */
export function valueNoise(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const tx = smooth(x - xi);
  const ty = smooth(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}

/** Fractal noise: `octaves` layers of value noise, normalised to [0, 1). */
export function fbm(x: number, y: number, octaves = 3, seed = 0): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(x * f, y * f, seed + o) * amp;
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

/** How much fog a band holds at height v (0 top, 1 bottom): none high up, thick at the ground. */
export function groundDensity(v: number, horizon: number): number {
  if (v <= horizon) return 0;
  const t = Math.min(1, (v - horizon) / (1 - horizon));
  return t * t * (3 - 2 * t);
}

export interface FogTint {
  r: number;
  g: number;
  b: number;
  /** Overall strength multiplier. */
  amount: number;
}

/** Per-chapter fog colour and thickness. */
export const FOG_TINTS: Record<string, FogTint> = {
  gate: { r: 170, g: 165, b: 200, amount: 0.9 },
  grounds: { r: 175, g: 185, b: 180, amount: 1.15 },
  attic: { r: 150, g: 130, b: 110, amount: 0.45 },
  castle: { r: 150, g: 160, b: 200, amount: 0.85 },
  archive: { r: 160, g: 140, b: 120, amount: 0.35 },
};

export function tintFor(chapter: string | undefined): FogTint {
  return (chapter && FOG_TINTS[chapter]) || FOG_TINTS.gate;
}

interface Layer {
  scale: number;
  speed: number;
  horizon: number;
  alpha: number;
  seed: number;
}

/** Far, middle and near bands. Far is fine and slow; near is coarse, fast and thick. */
export const FOG_LAYERS: readonly Layer[] = [
  { scale: 7, speed: 0.012, horizon: 0.35, alpha: 0.35, seed: 11 },
  { scale: 4.5, speed: 0.022, horizon: 0.5, alpha: 0.5, seed: 23 },
  { scale: 2.6, speed: 0.04, horizon: 0.62, alpha: 0.7, seed: 37 },
];

const W = 96;
const H = 54;
const FRAME_MS = 50;

export function startFog(
  canvas: HTMLCanvasElement,
  isStatic: () => boolean,
  chapter: () => string | undefined = () => document.documentElement.dataset.chapter,
): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;
  const c = ctx;
  const buf = document.createElement('canvas');
  buf.width = W;
  buf.height = H;
  const bctx = buf.getContext('2d');
  if (!bctx) return () => undefined;
  const img = bctx.createImageData(W, H);
  let raf = 0;
  let lastDraw = 0;
  let t = Math.random() * 100;

  const resize = () => {
    canvas.width = Math.max(1, Math.floor(window.innerWidth / 2));
    canvas.height = Math.max(1, Math.floor(window.innerHeight / 2));
    draw();
  };

  function draw() {
    const tint = tintFor(chapter());
    const d = img.data;
    for (let y = 0; y < H; y++) {
      const v = y / (H - 1);
      for (let x = 0; x < W; x++) {
        const u = x / (W - 1);
        let a = 0;
        for (const L of FOG_LAYERS) {
          const dens = groundDensity(v, L.horizon);
          if (dens === 0) continue;
          const n = fbm(u * L.scale + t * L.speed * L.scale, v * L.scale * 0.6, 3, L.seed);
          // Sharpen so the fog reads as banks and gaps, not a flat haze.
          const banks = Math.max(0, n * 1.6 - 0.45);
          a += banks * dens * L.alpha;
        }
        const i = (y * W + x) * 4;
        d[i] = tint.r;
        d[i + 1] = tint.g;
        d[i + 2] = tint.b;
        d[i + 3] = Math.min(255, a * tint.amount * 150);
      }
    }
    bctx!.putImageData(img, 0, 0);
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.imageSmoothingEnabled = true;
    c.drawImage(buf, 0, 0, canvas.width, canvas.height);
  }

  const loop = (now: number) => {
    raf = 0;
    if (document.visibilityState === 'hidden') return;
    if (isStatic()) {
      draw();
      return;
    }
    if (now - lastDraw >= FRAME_MS) {
      const dt = lastDraw ? Math.min(0.2, (now - lastDraw) / 1000) : 0;
      lastDraw = now;
      t += dt;
      draw();
    }
    raf = requestAnimationFrame(loop);
  };
  const kick = () => {
    cancelAnimationFrame(raf);
    lastDraw = 0;
    raf = requestAnimationFrame(loop);
  };
  const onVisibility = () => {
    if (document.visibilityState === 'visible') kick();
    else cancelAnimationFrame(raf);
  };
  // Redraw when the chapter or motion settings change, so the static frame follows them.
  const mo = new MutationObserver(kick);
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-chapter', 'data-reduced-motion', 'data-safe-mode'],
  });

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibility);
  kick();
  return () => {
    cancelAnimationFrame(raf);
    mo.disconnect();
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
