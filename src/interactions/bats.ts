import { batsAllowed } from './gating';
import type { Interaction, InteractionContext } from './types';

const MAX_BATS = 6;
const TIMER_MIN_MS = 25000;
const TIMER_SPREAD_MS = 25000;

interface Bat {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
}

let canvas: HTMLCanvasElement | null = null;
let cleanup: (() => void) | null = null;

export const bats: Interaction = {
  init(ctx: InteractionContext) {
    bats.destroy();
    const cv = document.createElement('canvas');
    cv.className = 'fx bats';
    cv.setAttribute('aria-hidden', 'true');
    ctx.root.appendChild(cv);
    canvas = cv;
    const g = cv.getContext('2d');
    const img = new Image();
    img.src = ctx.assets.pick('bats') ?? '';
    let flock: Bat[] = [];
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const resize = () => {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const allowed = () => batsAllowed(ctx.settings.get(), ctx.osReducedMotion());
    const frame = (t: number) => {
      raf = 0;
      if (!g) return;
      g.clearRect(0, 0, cv.width, cv.height);
      flock = flock.filter((b) => b.x > -60 && b.x < cv.width + 60);
      for (const b of flock) {
        b.x += b.vx;
        b.y += b.vy + Math.sin(t / 150 + b.phase) * 1.5;
        if (img.complete && img.naturalWidth > 0) g.drawImage(img, b.x, b.y, 40, 28);
        else g.fillRect(b.x, b.y, 24, 8);
      }
      if (flock.length > 0 && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const release = (x: number, y: number) => {
      if (!allowed() || document.hidden || flock.length > 0) return;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const n = 3 + Math.floor(Math.random() * (MAX_BATS - 2));
      for (let i = 0; i < n; i++) {
        flock.push({
          x: dir > 0 ? -40 - i * 30 : cv.width + 40 + i * 30,
          y: Math.max(0, y - 80 + Math.random() * 160),
          vx: dir * (3 + Math.random() * 2),
          vy: -0.5 + Math.random(),
          phase: Math.random() * 6,
        });
      }
      void x;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      // Only empty space triggers bats, never controls.
      if (t && t.closest('button, a, input, select, [role="dialog"]')) return;
      release(e.clientX, e.clientY);
    };
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (!document.hidden) release(0, Math.random() * cv.height * 0.5);
          schedule();
        },
        TIMER_MIN_MS + Math.random() * TIMER_SPREAD_MS,
      );
    };
    const onVisibility = () => {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!document.hidden && flock.length > 0 && !raf) {
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVisibility);
    schedule();
    cleanup = () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', resize);
      document.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  },
  destroy() {
    cleanup?.();
    cleanup = null;
    canvas?.remove();
    canvas = null;
  },
};
