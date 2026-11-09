import { effectiveReducedMotion } from '../a11y/reducedMotion';
import type { Interaction } from './types';

let btn: HTMLButtonElement | null = null;

export const labLever: Interaction = {
  init(ctx) {
    labLever.destroy();
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lab__lever';
    b.setAttribute('aria-pressed', 'false');
    b.textContent = 'Pull the lever';
    b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      ctx.root.classList.toggle('lab--live', on);
      const still =
        effectiveReducedMotion(ctx.settings.get(), ctx.osReducedMotion()) ||
        ctx.settings.get().safeMode;
      ctx.announce(
        on
          ? still
            ? 'The monster stirs. Animation is off.'
            : 'The coil crackles and the monster stirs.'
          : 'The lab falls quiet.',
      );
    });
    ctx.root.appendChild(b);
    btn = b;
  },
  destroy() {
    btn?.remove();
    btn = null;
  },
};
