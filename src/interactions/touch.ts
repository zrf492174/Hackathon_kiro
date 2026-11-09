import type { Interaction } from './types';

/** True for devices whose primary pointer is coarse (finger). */
export function isCoarsePointer(
  win: Pick<Window, 'matchMedia'> | undefined = typeof window === 'undefined' ? undefined : window,
): boolean {
  return (
    !!win && typeof win.matchMedia === 'function' && win.matchMedia('(pointer: coarse)').matches
  );
}

let cleanup: (() => void) | null = null;

/** Touch support: marks coarse devices for 44px targets and tracks finger drag for the flashlight. */
export const touch: Interaction = {
  init() {
    touch.destroy();
    const html = document.documentElement;
    html.dataset.touch = String(isCoarsePointer());
    const track = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      html.style.setProperty('--touch-x', `${e.clientX}px`);
      html.style.setProperty('--touch-y', `${e.clientY}px`);
    };
    window.addEventListener('pointermove', track, { passive: true });
    window.addEventListener('pointerdown', track, { passive: true });
    cleanup = () => {
      window.removeEventListener('pointermove', track);
      window.removeEventListener('pointerdown', track);
      delete html.dataset.touch;
    };
  },
  destroy() {
    cleanup?.();
    cleanup = null;
  },
};
