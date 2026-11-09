import { figureLungeAllowed, figureMotionAllowed } from './gating';
import type { Interaction } from './types';

export type FigureMove = 'wave' | 'howl' | 'glow' | 'turn' | 'creep';

export interface Figure {
  id: string;
  /** Accessible name of the button. */
  label: string;
  /** Text announced when the figure is activated. */
  caption: string;
  move: FigureMove;
  /** Edge placement, in viewport percent. */
  side: 'left' | 'right';
  bottom: number;
  svg: string;
}

const eyes = (cx: number, cy: number, gap = 4) =>
  `<circle class="figure__eye" cx="${cx - gap}" cy="${cy}" r="1.6"/><circle class="figure__eye" cx="${cx + gap}" cy="${cy}" r="1.6"/>`;

/** All original silhouettes, inspired by public-domain-era literature and silent film archetypes. */
export const FIGURES: Record<string, Figure> = {
  nosferatu: {
    id: 'nosferatu',
    label: 'Long-fingered shadow on the stairs',
    caption: 'A long-fingered shadow creeps one step higher, then stops.',
    move: 'creep',
    side: 'left',
    bottom: 12,
    svg: `<path d="M8 90 L8 70 L18 70 L18 58 L28 58 L28 46 L38 46 L38 90 Z" fill="#241d33"/>
      <path d="M30 46 Q26 30 32 22 Q36 16 40 22 Q46 30 42 46 Z" fill="#0a0710"/>
      <path d="M31 22 L27 12 L34 18 M41 22 L45 12 L39 18" stroke="#0a0710" stroke-width="2" fill="none"/>
      <path class="figure__arm" d="M42 34 L56 20 M56 20 L58 6 M56 20 L62 8 M56 20 L66 12 M56 20 L68 18" stroke="#0a0710" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      ${eyes(36, 28, 3)}`,
  },
  dracula: {
    id: 'dracula',
    label: 'Caped gentleman silhouette',
    caption: 'The caped figure inclines his head. "Welcome. Enter freely."',
    move: 'turn',
    side: 'right',
    bottom: 14,
    svg: `<path class="figure__cape" d="M30 22 L8 88 Q30 94 52 88 L30 22 Z" fill="#0a0710"/>
      <path d="M30 22 L18 30 L22 46 L30 34 L38 46 L42 30 Z" fill="#3a1020"/>
      <g class="figure__head"><circle cx="30" cy="16" r="7" fill="#d9d2c3"/>
      <path d="M23 14 Q30 4 37 14 L33 10 L30 14 L27 10 Z" fill="#0a0710"/>
      <circle class="figure__eye" cx="27.5" cy="16" r="1.3"/><circle class="figure__eye" cx="32.5" cy="16" r="1.3"/></g>`,
  },
  frankenstein: {
    id: 'frankenstein',
    label: 'Gaunt wanderer with yellow eyes',
    caption: 'The gaunt wanderer lifts a long arm and gazes back with watery yellow eyes.',
    move: 'wave',
    side: 'left',
    bottom: 10,
    svg: `<path d="M20 30 L14 90 L46 90 L40 30 Z" fill="#1a1626"/>
      <path class="figure__arm" d="M40 36 L54 50 L56 62" stroke="#1a1626" stroke-width="6" stroke-linecap="round" fill="none"/>
      <g class="figure__head"><ellipse cx="30" cy="20" rx="9" ry="11" fill="#6f7a5c"/>
      <path d="M20 16 Q22 4 30 6 Q40 4 40 16 Q36 10 30 12 Q24 10 20 16 Z" fill="#0a0710"/>
      <path d="M24 26 H36 M27 24 V28 M30 24 V28 M33 24 V28" stroke="#2c2a22" stroke-width="0.8"/>
      <circle class="figure__eye" cx="26" cy="19" r="1.6"/><circle class="figure__eye" cx="34" cy="19" r="1.6"/></g>`,
  },
  sleepwalker: {
    id: 'sleepwalker',
    label: 'Sleepwalker with outstretched arms',
    caption: 'The sleepwalker drifts a step forward with eyes closed, then freezes.',
    move: 'creep',
    side: 'left',
    bottom: 20,
    svg: `<path d="M24 28 L20 70 L40 70 L36 28 Z" fill="#cfc8d8"/>
      <path class="figure__arm" d="M36 32 L58 32 M24 32 L4 32" stroke="#cfc8d8" stroke-width="4" stroke-linecap="round"/>
      <path d="M24 70 V90 M36 70 V90" stroke="#0a0710" stroke-width="4"/>
      <circle cx="30" cy="20" r="8" fill="#e6e0ec"/><path d="M25 19 H29 M31 19 H35" stroke="#0a0710" stroke-width="1.2"/>
      <path d="M22 14 Q30 4 38 14" stroke="#0a0710" stroke-width="3" fill="none"/>`,
  },
  mummy: {
    id: 'mummy',
    label: 'Bandaged wanderer',
    caption: 'The bandaged wanderer unwinds a strip of linen and offers it to you.',
    move: 'wave',
    side: 'right',
    bottom: 8,
    svg: `<rect x="20" y="30" width="20" height="60" rx="6" fill="#cdbf9a"/>
      <circle cx="30" cy="20" r="9" fill="#d8caa5"/>
      <g stroke="#8a7a55" stroke-width="1"><path d="M21 38 L39 44 M21 48 L39 54 M21 58 L39 64 M21 68 L39 74 M22 16 L38 22"/></g>
      <path class="figure__arm" d="M40 38 L52 44 L56 36" stroke="#cdbf9a" stroke-width="5" stroke-linecap="round" fill="none"/>
      <rect x="22" y="17" width="16" height="3" fill="#0a0710"/>${eyes(30, 18.5, 3.5)}`,
  },
  werewolf: {
    id: 'werewolf',
    label: 'Werewolf silhouette',
    caption: 'The werewolf throws back its head and howls at the moon. Awooo.',
    move: 'howl',
    side: 'right',
    bottom: 10,
    svg: `<path d="M14 90 L18 56 Q22 40 34 40 L46 52 L44 90 Z" fill="#3b3350" stroke="#b9a7e0" stroke-width="1"/>
      <path d="M44 80 Q60 78 62 66 Q56 72 46 70" fill="#3b3350" stroke="#b9a7e0" stroke-width="1"/>
      <g class="figure__head"><path d="M26 44 L22 24 L30 30 L38 24 L36 40 L50 18 L54 22 L40 46 Z" fill="#3b3350" stroke="#b9a7e0" stroke-width="1"/>
      <circle class="figure__eye" cx="32" cy="34" r="1.5"/></g>`,
  },
};

/** Which figures live in which scene. */
export const SCENE_FIGURES: Record<string, string[]> = {
  gate: ['mummy'],
  attic: ['nosferatu'],
  graveyard: ['werewolf', 'sleepwalker'],
  castle: ['dracula', 'frankenstein'],
};

export function figuresForScene(scene: string): Figure[] {
  return (SCENE_FIGURES[scene] ?? []).map((id) => FIGURES[id]).filter(Boolean);
}

/** Build the button element for one figure (pure DOM, no listeners). */
export function figureButton(f: Figure): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `figure figure--${f.id} figure--${f.side}`;
  b.dataset.figure = f.id;
  b.style.bottom = `calc(${f.bottom}% + 9rem)`;
  b.setAttribute('aria-label', f.label);
  b.innerHTML = `<svg viewBox="0 0 70 92" aria-hidden="true" focusable="false">${f.svg}</svg>`;
  return b;
}

/** Interaction factory: mounts the scene's homage figures as focusable buttons. */
export function createFigures(scene: string): Interaction {
  let buttons: HTMLButtonElement[] = [];
  const timers = new Set<number>();
  const self: Interaction = {
    init(ctx) {
      self.destroy();
      for (const f of figuresForScene(scene)) {
        const b = figureButton(f);
        b.addEventListener('click', () => {
          const s = ctx.settings.get();
          const os = ctx.osReducedMotion();
          b.classList.add('figure--glow');
          if (figureMotionAllowed(s, os)) {
            b.classList.add(`figure--${f.move}`);
            if (figureLungeAllowed(s, os)) b.classList.add('figure--lunge');
          }
          ctx.announce(f.caption);
          const t = window.setTimeout(() => {
            timers.delete(t);
            b.classList.remove(`figure--${f.move}`, 'figure--lunge', 'figure--glow');
          }, 3000);
          timers.add(t);
        });
        ctx.root.appendChild(b);
        buttons.push(b);
      }
    },
    destroy() {
      for (const t of timers) clearTimeout(t);
      timers.clear();
      for (const b of buttons) b.remove();
      buttons = [];
    },
  };
  return self;
}
