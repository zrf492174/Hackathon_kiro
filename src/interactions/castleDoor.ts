import type { Interaction } from './types';

export const GOTO_EVENT = 'hollow:goto';

let btn: HTMLButtonElement | null = null;

export const castleDoor: Interaction = {
  init(ctx) {
    castleDoor.destroy();
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'castle__door';
    b.textContent = 'Cross the drawbridge to the library';
    b.addEventListener('click', () =>
      window.dispatchEvent(new CustomEvent(GOTO_EVENT, { detail: 'library' })),
    );
    ctx.root.appendChild(b);
    btn = b;
  },
  destroy() {
    btn?.remove();
    btn = null;
  },
};
