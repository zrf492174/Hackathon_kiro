import type { InteractionContext } from '../interactions';
import { enterGate, leaveGate } from './gate';
import { attic } from './attic';
import { graveyard } from './graveyard';
import { pumpkinPatch } from './pumpkinPatch';
import { foggyTown } from './fogTown';
import { castle, gazetteScene, lab, library } from './gothic';
import { GOTO_EVENT } from '../interactions/castleDoor';

export type SceneId =
  'gate' | 'patch' | 'graveyard' | 'fog' | 'attic' | 'castle' | 'lab' | 'library' | 'gazette';

export const SCENE_GROUPS: { label: string; scenes: { id: SceneId; label: string }[] }[] = [
  {
    label: 'Outdoors',
    scenes: [
      { id: 'gate', label: 'Gate' },
      { id: 'patch', label: 'Pumpkin patch' },
      { id: 'graveyard', label: 'Graveyard' },
      { id: 'fog', label: 'Foggy Town' },
    ],
  },
  {
    label: 'Indoors',
    scenes: [
      { id: 'attic', label: 'Attic' },
      { id: 'castle', label: 'Castle' },
      { id: 'lab', label: 'Laboratory' },
      { id: 'library', label: 'Library' },
      { id: 'gazette', label: 'Gazette' },
    ],
  },
];

export const SCENES: { id: SceneId; label: string }[] = SCENE_GROUPS.flatMap((g) => g.scenes);

/** Resolve an unknown value (e.g. from a URL hash) to a valid scene id, defaulting to the gate. */
export function parseSceneId(raw: string | null | undefined): SceneId {
  const id = (raw ?? '').replace(/^#/, '');
  return SCENES.some((s) => s.id === id) ? (id as SceneId) : 'gate';
}

const enters: Record<SceneId, (ctx: InteractionContext) => void> = {
  gate: enterGate,
  attic: (c) => attic.enter(c),
  graveyard: (c) => graveyard.enter(c),
  patch: (c) => pumpkinPatch.enter(c),
  castle: (c) => castle.enter(c),
  lab: (c) => lab.enter(c),
  library: (c) => library.enter(c),
  gazette: (c) => gazetteScene.enter(c),
  fog: (c) => foggyTown.enter(c),
};

export function leaveAll(): void {
  leaveGate();
  attic.leave();
  graveyard.leave();
  pumpkinPatch.leave();
  castle.leave();
  lab.leave();
  library.leave();
  gazetteScene.leave();
  foggyTown.leave();
}

/** Mounts a compact, grouped (Outdoors / Indoors) keyboard accessible scene nav and switches scenes, destroying the previous one. */
export function mountSceneNav(host: HTMLElement, ctx: InteractionContext): void {
  const nav = document.createElement('nav');
  nav.className = 'scene-nav';
  nav.setAttribute('aria-label', 'Scenes');
  const buttons = new Map<SceneId, HTMLButtonElement>();
  const go = (id: SceneId) => {
    leaveAll();
    enters[id](ctx);
    for (const [k, b] of buttons) b.setAttribute('aria-current', k === id ? 'page' : 'false');
    ctx.announce(`Entered ${SCENES.find((s) => s.id === id)?.label ?? id}.`);
  };
  for (const g of SCENE_GROUPS) {
    const group = document.createElement('div');
    group.className = 'scene-nav__group';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', g.label);
    const title = document.createElement('span');
    title.className = 'scene-nav__title';
    title.setAttribute('aria-hidden', 'true');
    title.textContent = g.label;
    group.appendChild(title);
    for (const s of g.scenes) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = s.label;
      b.addEventListener('click', () => go(s.id));
      buttons.set(s.id, b);
      group.appendChild(b);
    }
    nav.appendChild(group);
  }
  window.addEventListener(GOTO_EVENT, (e) => go(parseSceneId(String((e as CustomEvent).detail))));
  host.appendChild(nav);
  go('gate');
}
