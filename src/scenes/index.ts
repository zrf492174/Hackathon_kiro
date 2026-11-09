import type { InteractionContext } from '../interactions';
import { enterGate, leaveGate } from './gate';
import { attic } from './attic';
import { graveyard } from './graveyard';
import { pumpkinPatch } from './pumpkinPatch';

export type SceneId = 'gate' | 'attic' | 'graveyard' | 'patch';

export const SCENES: { id: SceneId; label: string }[] = [
  { id: 'gate', label: 'Gate' },
  { id: 'attic', label: 'Attic' },
  { id: 'graveyard', label: 'Graveyard' },
  { id: 'patch', label: 'Pumpkin patch' },
];

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
};

export function leaveAll(): void {
  leaveGate();
  attic.leave();
  graveyard.leave();
  pumpkinPatch.leave();
}

/** Mounts keyboard accessible scene buttons and switches scenes, destroying the previous one. */
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
  for (const s of SCENES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s.label;
    b.addEventListener('click', () => go(s.id));
    buttons.set(s.id, b);
    nav.appendChild(b);
  }
  host.appendChild(nav);
  go('gate');
}
