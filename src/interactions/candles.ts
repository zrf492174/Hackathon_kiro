import type { Interaction, InteractionContext } from './types';

const COUNT = 3;
const HOLD_MS = 400;

/** Global brightness from number of lit candles: 1 when all lit, 0.35 when all out. */
export function brightnessFor(lit: number, total = COUNT): number {
  if (total <= 0) return 1;
  const clamped = Math.min(Math.max(lit, 0), total);
  return 0.35 + 0.65 * (clamped / total);
}

let row: HTMLElement | null = null;
let cleanup: (() => void) | null = null;

export const candles: Interaction = {
  init(ctx: InteractionContext) {
    candles.destroy();
    const el = document.createElement('div');
    el.className = 'candle-row';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', 'Three candles');
    const lit = new Array<boolean>(COUNT).fill(true);
    const buttons: HTMLButtonElement[] = [];
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const apply = () => {
      const n = lit.filter(Boolean).length;
      document.documentElement.style.setProperty('--brightness', String(brightnessFor(n)));
      lit.forEach((on, i) => {
        buttons[i].setAttribute('aria-pressed', String(!on));
        buttons[i].setAttribute('aria-label', `Candle ${i + 1}, ${on ? 'lit' : 'blown out'}`);
        buttons[i].classList.toggle('candle-btn--out', !on);
      });
    };
    for (let i = 0; i < COUNT; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'candle-btn';
      b.innerHTML = '<span class="candle-btn__flame"></span><span class="candle-btn__wax"></span>';
      let holdTimer: ReturnType<typeof setTimeout> | undefined;
      let held = false;
      // Click toggles; a press and hold also blows out (touch friendly).
      b.addEventListener('pointerdown', () => {
        held = false;
        holdTimer = setTimeout(() => {
          held = true;
          lit[i] = false;
          apply();
          ctx.announce(`Candle ${i + 1} blown out.`);
        }, HOLD_MS);
        timers.add(holdTimer);
      });
      const cancel = () => clearTimeout(holdTimer);
      b.addEventListener('pointerup', cancel);
      b.addEventListener('pointerleave', cancel);
      b.addEventListener('click', () => {
        if (held) {
          held = false;
          return;
        }
        lit[i] = !lit[i];
        apply();
        ctx.announce(`Candle ${i + 1} ${lit[i] ? 'relit' : 'blown out'}.`);
      });
      buttons.push(b);
      el.appendChild(b);
    }
    apply();
    ctx.root.appendChild(el);
    row = el;
    cleanup = () => {
      for (const t of timers) clearTimeout(t);
      timers.clear();
      document.documentElement.style.removeProperty('--brightness');
    };
  },
  destroy() {
    cleanup?.();
    cleanup = null;
    row?.remove();
    row = null;
  },
};
