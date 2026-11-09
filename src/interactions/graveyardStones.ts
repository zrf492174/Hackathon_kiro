import { figureMotionAllowed } from './gating';
import type { Interaction } from './types';

export interface Stone {
  id: string;
  name: string;
  epitaph: string;
  shape: 'round' | 'cross' | 'obelisk' | 'slab' | 'angel';
}

export const STONES: Stone[] = [
  {
    id: 'a',
    name: 'Ebenezer Gloam',
    epitaph: 'He said he would be right back. That was 1851.',
    shape: 'round',
  },
  {
    id: 'b',
    name: 'Mirabel Thorne',
    epitaph: 'Beloved sister. Please stop knocking.',
    shape: 'cross',
  },
  {
    id: 'c',
    name: 'Cornelius Dusk',
    epitaph: 'Here lies a man who was always early, and is now permanently late.',
    shape: 'obelisk',
  },
  {
    id: 'd',
    name: 'Lucretia Vane',
    epitaph: 'She kept every secret. Mostly in the garden.',
    shape: 'slab',
  },
  { id: 'e', name: 'Silas Wick', epitaph: 'Tended the lamps. The lamps remember.', shape: 'round' },
  {
    id: 'f',
    name: 'The Weeping Watcher',
    epitaph: 'Do not look at her for too long. She is looking back.',
    shape: 'angel',
  },
  {
    id: 'g',
    name: 'Odalys Fenn',
    epitaph: 'Rest well. Or do not. We will not tell.',
    shape: 'cross',
  },
  { id: 'h', name: 'Unknown', epitaph: 'Dug up twice. Third time is the charm.', shape: 'slab' },
];

export function epitaphText(s: Stone): string {
  return `${s.name}: ${s.epitaph}`;
}

export function stoneById(id: string): Stone | undefined {
  return STONES.find((s) => s.id === id);
}

let wrap: HTMLElement | null = null;

/** Focusable tombstones that reveal an epitaph; a hand rises when scares or motion allow. */
export const graveyardStones: Interaction = {
  init(ctx) {
    graveyardStones.destroy();
    const w = document.createElement('div');
    w.className = 'yard__stones';
    w.setAttribute('role', 'group');
    w.setAttribute('aria-label', 'Tombstones');
    const caption = document.createElement('p');
    caption.className = 'yard__epitaph';
    caption.setAttribute('aria-live', 'polite');
    caption.textContent = 'Choose a tombstone to read its epitaph.';
    const hand = document.createElement('div');
    hand.className = 'yard__hand';
    hand.setAttribute('aria-hidden', 'true');
    hand.innerHTML =
      '<svg viewBox="0 0 40 70"><path d="M14 70 V40 Q8 34 10 26 Q12 22 15 28 V12 Q17 8 19 12 V26 V8 Q21 4 23 8 V26 V12 Q25 8 27 12 V30 V22 Q30 20 31 24 V44 Q32 56 30 70 Z" fill="#4a5a44" stroke="#0a0710" stroke-width="1"/></svg>';
    STONES.forEach((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `stone stone--${s.shape}`;
      b.dataset.stone = s.id;
      b.setAttribute('aria-label', `${s.shape === 'cross' ? '' : 'RIP '}Tombstone of ${s.name}`);
      b.innerHTML = `<span class="stone__rip">${s.shape === 'cross' ? '✝' : 'RIP'}</span>`;
      b.addEventListener('click', () => {
        const text = epitaphText(s);
        caption.textContent = text;
        ctx.announce(text);
        w.querySelectorAll('.stone--read').forEach((e) => e.classList.remove('stone--read'));
        b.classList.add('stone--read');
        if (s.id === 'h') ctx.addScore(10);
      });
      w.appendChild(b);
    });
    // The hand shows up at rest (static) when motion is limited, rising slowly otherwise.
    if (!figureMotionAllowed(ctx.settings.get(), ctx.osReducedMotion())) {
      hand.classList.add('yard__hand--still');
    }
    hand.classList.add('yard__hand--up');
    ctx.root.append(hand, w, caption);
    wrap = w;
    wrapExtras = [hand, caption];
  },
  destroy() {
    wrap?.remove();
    wrap = null;
    for (const e of wrapExtras) e.remove();
    wrapExtras = [];
  },
};
let wrapExtras: HTMLElement[] = [];
