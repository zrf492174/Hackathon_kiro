import { PumpkinPuzzle } from './pumpkinPuzzle';
import type { Interaction, InteractionContext } from './types';

let row: HTMLElement | null = null;

export const pumpkin: Interaction = {
  init(ctx: InteractionContext) {
    pumpkin.destroy();
    const puzzle = new PumpkinPuzzle();
    const urls = ctx.assets.urls('pumpkins');
    const onUrl = urls[0] ?? '';
    const offUrl = urls[1] ?? onUrl;
    const el = document.createElement('div');
    el.className = 'pumpkin-row';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', 'Row of five jack-o-lanterns');
    const buttons: HTMLButtonElement[] = [];
    const render = () => {
      puzzle.state.forEach((on, i) => {
        const b = buttons[i];
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-label', `Pumpkin ${i + 1}, ${on ? 'lit' : 'unlit'}`);
        b.classList.toggle('pumpkin--on', on);
        (b.firstElementChild as HTMLImageElement).src = on ? onUrl : offUrl;
      });
    };
    for (let i = 0; i < puzzle.size; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pumpkin';
      const img = document.createElement('img');
      img.alt = '';
      b.appendChild(img);
      // Native buttons handle Enter and Space by firing click.
      b.addEventListener('click', () => {
        const r = puzzle.press(i);
        render();
        if (r === 'reset') ctx.announce('The pumpkins flicker out. Try another order.');
        else if (r === 'solved') {
          ctx.announce('A hidden door creaks open.');
          ctx.addScore(50);
          for (const u of urls) ctx.discover?.(u);
          ctx.root.querySelector('.hidden-door')?.removeAttribute('hidden');
        }
      });
      buttons.push(b);
      el.appendChild(b);
    }
    render();
    ctx.root.appendChild(el);
    row = el;
  },
  destroy() {
    row?.remove();
    row = null;
  },
};
