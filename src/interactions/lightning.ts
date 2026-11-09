import { lightningAllowed, thunderAllowed } from './gating';
import type { Interaction, InteractionContext } from './types';

export const LIGHTNING_MIN_MS = 15000;
export const LIGHTNING_MAX_MS = 40000;
export const MAX_FLASHES_PER_SEC = 3;

/** Random delay between 15 and 40 s. */
export function nextLightningDelay(rng: () => number = Math.random): number {
  return LIGHTNING_MIN_MS + rng() * (LIGHTNING_MAX_MS - LIGHTNING_MIN_MS);
}

/** Allows at most `max` flashes in any rolling 1 s window. */
export function canFlash(history: number[], now: number, max = MAX_FLASHES_PER_SEC): boolean {
  return history.filter((t) => now - t < 1000).length < max;
}

let layer: HTMLElement | null = null;
let cleanup: (() => void) | null = null;

export const lightning: Interaction = {
  init(ctx: InteractionContext) {
    lightning.destroy();
    const wrap = document.createElement('div');
    wrap.className = 'lightning';
    wrap.setAttribute('aria-hidden', 'true');
    const rain = document.createElement('canvas');
    rain.className = 'fx rain';
    const flash = document.createElement('div');
    flash.className = 'lightning__flash';
    wrap.append(rain, flash);
    ctx.root.appendChild(wrap);
    layer = wrap;
    const g = rain.getContext('2d');
    const allowed = () => lightningAllowed(ctx.settings.get(), ctx.osReducedMotion());
    const history: number[] = [];
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let flashTimer: ReturnType<typeof setTimeout> | undefined;
    const drops = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random() }));

    const resize = () => {
      rain.width = window.innerWidth;
      rain.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stopRain = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      g?.clearRect(0, 0, rain.width, rain.height);
    };
    const frame = () => {
      raf = 0;
      if (!g || !allowed() || document.hidden) return;
      g.clearRect(0, 0, rain.width, rain.height);
      g.strokeStyle = 'rgba(180,190,220,0.35)';
      g.beginPath();
      for (const d of drops) {
        d.y += 0.02;
        if (d.y > 1) d.y = 0;
        const x = d.x * rain.width;
        const y = d.y * rain.height;
        g.moveTo(x, y);
        g.lineTo(x - 3, y + 14);
      }
      g.stroke();
      raf = requestAnimationFrame(frame);
    };
    const startRain = () => {
      if (!raf && allowed() && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const strike = () => {
      const now = Date.now();
      if (!allowed() || document.hidden || !canFlash(history, now)) return;
      history.push(now);
      if (history.length > 10) history.shift();
      flash.classList.remove('lightning__flash--on');
      void flash.offsetWidth;
      flash.classList.add('lightning__flash--on');
      flashTimer = setTimeout(() => flash.classList.remove('lightning__flash--on'), 500);
      if (thunderAllowed(ctx.settings.get())) setTimeout(() => ctx.audio.play('thunder'), 800);
    };
    const schedule = () => {
      timer = setTimeout(() => {
        strike();
        schedule();
      }, nextLightningDelay());
    };
    const unsub = ctx.settings.subscribe(() => (allowed() ? startRain() : stopRain()));
    const onVisibility = () => (document.hidden ? stopRain() : startRain());
    document.addEventListener('visibilitychange', onVisibility);
    startRain();
    schedule();
    cleanup = () => {
      stopRain();
      clearTimeout(timer);
      clearTimeout(flashTimer);
      unsub();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  },
  destroy() {
    cleanup?.();
    cleanup = null;
    layer?.remove();
    layer = null;
  },
};
