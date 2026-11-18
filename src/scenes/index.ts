import type { InteractionContext } from '../interactions';
import type { ChapterId } from '../story/chapters';
import { enterGate, leaveGate } from './gate';
import { attic } from './attic';
import { archive } from './archive';
import { graveyard } from './graveyard';
import { pumpkinPatch } from './pumpkinPatch';
import { foggyTown } from './fogTown';
import { castle, lab } from './gothic';

/** A place a visitor can stand. Several areas make up one story chapter. */
export type SceneId =
  | 'gate'
  | 'patch'
  | 'graveyard'
  | 'fog'
  | 'attic'
  | 'castle'
  | 'lab'
  | 'library'
  | 'gazette'
  | 'archive';

export interface Area {
  id: SceneId;
  label: string;
}

/** Areas inside each chapter. The first is where the chapter opens. */
export const CHAPTER_AREAS: Record<ChapterId, Area[]> = {
  gate: [{ id: 'gate', label: 'The gate' }],
  grounds: [
    { id: 'patch', label: 'Pumpkin patch' },
    { id: 'graveyard', label: 'Churchyard' },
    { id: 'fog', label: 'Foggy street' },
  ],
  attic: [{ id: 'attic', label: 'The attic' }],
  castle: [
    { id: 'castle', label: 'Castle hall' },
    { id: 'lab', label: 'Laboratory' },
  ],
  archive: [{ id: 'archive', label: 'The archive' }],
};

export const SCENES: Area[] = Object.values(CHAPTER_AREAS).flat();

/** Chapter that holds an area, for deep links and the goto event. */
export function chapterOfArea(id: SceneId): ChapterId {
  for (const [chapter, areas] of Object.entries(CHAPTER_AREAS)) {
    if (areas.some((a) => a.id === id)) return chapter as ChapterId;
  }
  return 'gate';
}

const KNOWN: SceneId[] = [...SCENES.map((s) => s.id), 'library', 'gazette'];

/** Resolve an unknown value (e.g. from a URL hash) to a valid area id, defaulting to the gate. */
export function parseSceneId(raw: string | null | undefined): SceneId {
  const id = (raw ?? '').replace(/^#/, '');
  return KNOWN.includes(id as SceneId) ? (id as SceneId) : 'gate';
}

const enters: Record<SceneId, (ctx: InteractionContext) => void> = {
  gate: enterGate,
  attic: (c) => attic.enter(c),
  graveyard: (c) => graveyard.enter(c),
  patch: (c) => pumpkinPatch.enter(c),
  castle: (c) => castle.enter(c),
  lab: (c) => lab.enter(c),
  archive: (c) => archive.enter(c),
  library: (c) => archive.enter(c),
  gazette: (c) => archive.enter(c),
  fog: (c) => foggyTown.enter(c),
};

export function enterArea(id: SceneId, ctx: InteractionContext): void {
  leaveAll();
  enters[id](ctx);
}

export function leaveAll(): void {
  leaveGate();
  attic.leave();
  graveyard.leave();
  pumpkinPatch.leave();
  castle.leave();
  lab.leave();
  archive.leave();
  foggyTown.leave();
}
