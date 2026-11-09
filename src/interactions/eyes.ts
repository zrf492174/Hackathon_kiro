import { eyesAnimated } from './gating';
import type { Interaction, InteractionContext } from './types';

const MAX_EYES = 4;
export const FLEE_DISTANCE = 120;

/** True when the pointer is within `radius` px of the point. */
export function withinRange(
  px: number,
  py: number,
  ex: number,
  ey: number,
  radius = FLEE_DISTANCE,
): boolean {
  return Math.hypot(px - ex, py - ey) <= radius;
}

let layer: HTMLElement | null = null;
let cleanup: (() => void) | null = null;

export const eyes: Interaction = {
  init(ctx: InteractionContext) {
    eyes.destroy();
    const host = document.createElement('div');
    host.className = 'eyes-layer';
    host.setAttribute('aria-hidden', 'true');
    ctx.root.appendChild(host);
    layer = host;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let spawnTimer: ReturnType<typeof setTimeout> | undefined;

    const remove = (el: HTMLElement) => {
      if (!el.isConnected) return;
      if (eyesAnimated(ctx.settings.get(), ctx.osReducedMotion())) {
        el.classList.add('eyes--gone');
        const t = setTimeout(() => {
          timers.delete(t);
          el.remove();
        }, 350);
        timers.add(t);
      } else {
        el.remove();
      }
    };
    const spawn = () => {
      if (document.hidden || host.childElementCount >= MAX_EYES) return;
      const el = document.createElement('div');
      el.className = 'eyes';
      el.style.left = `${5 + Math.random() * 85}%`;
      el.style.top = `${15 + Math.random() * 65}%`;
      el.innerHTML = '<span></span><span></span>';
      host.appendChild(el);
      const t = setTimeout(() => {
        timers.delete(t);
        remove(el);
      }, 12000);
      timers.add(t);
    };
    const schedule = () => {
      spawnTimer = setTimeout(
        () => {
          spawn();
          schedule();
        },
        5000 + Math.random() * 8000,
      );
    };
    const near = (x: number, y: number) => {
      for (const el of Array.from(host.children) as HTMLElement[]) {
        const r = el.getBoundingClientRect();
        if (withinRange(x, y, r.left + r.width / 2, r.top + r.height / 2)) remove(el);
      }
    };
    const onMove = (e: PointerEvent) => near(e.clientX, e.clientY);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    spawn();
    schedule();
    cleanup = () => {
      clearTimeout(spawnTimer);
      for (const t of timers) clearTimeout(t);
      timers.clear();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
    };
  },
  destroy() {
    cleanup?.();
    cleanup = null;
    layer?.remove();
    layer = null;
  },
};
