import { flashlightAllowed } from './gating';
import type { Interaction, InteractionContext } from './types';

let layer: HTMLElement | null = null;
let cleanup: (() => void) | null = null;

export const flashlight: Interaction = {
  init(ctx: InteractionContext) {
    flashlight.destroy();
    const dark = document.createElement('div');
    dark.className = 'flashlight';
    dark.setAttribute('aria-hidden', 'true');
    ctx.root.appendChild(dark);
    layer = dark;
    const apply = () => {
      dark.hidden = !flashlightAllowed(ctx.settings.get(), ctx.osReducedMotion());
    };
    apply();
    const unsub = ctx.settings.subscribe(apply);
    const at = (x: number, y: number) => {
      dark.style.setProperty('--fx', `${x}px`);
      dark.style.setProperty('--fy', `${y}px`);
    };
    const move = (e: PointerEvent) => at(e.clientX, e.clientY);
    // Keyboard users: follow the focused element.
    const focus = (e: FocusEvent) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      const r = t.getBoundingClientRect();
      at(r.left + r.width / 2, r.top + r.height / 2);
    };
    // Unified pointer events cover mouse, pen and touch drag.
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    document.addEventListener('focusin', focus);
    cleanup = () => {
      unsub();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', move);
      document.removeEventListener('focusin', focus);
    };
  },
  destroy() {
    cleanup?.();
    cleanup = null;
    layer?.remove();
    layer = null;
  },
};
