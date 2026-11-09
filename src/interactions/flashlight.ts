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
    const move = (e: PointerEvent) => {
      dark.style.setProperty('--fx', `${e.clientX}px`);
      dark.style.setProperty('--fy', `${e.clientY}px`);
    };
    // Unified pointer events cover mouse, pen and touch drag.
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', move, { passive: true });
    cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', move);
    };
  },
  destroy() {
    cleanup?.();
    cleanup = null;
    layer?.remove();
    layer = null;
  },
};
