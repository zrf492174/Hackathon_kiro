import type { ObjectiveId } from './events';

export type ChapterId = 'gate' | 'grounds' | 'attic' | 'castle' | 'archive';

export interface Chapter {
  id: ChapterId;
  title: string;
  /** Spoken as the chapter opens. */
  intro: string;
  /** What to do here, shown under the narration. */
  objective: string;
  objectiveId: ObjectiveId;
  /** Spoken when the objective is met. */
  done: string;
  /** Label of the continue button once the objective is met. */
  next: string;
}

export const CHAPTERS: readonly Chapter[] = [
  {
    id: 'gate',
    title: 'The Gate',
    intro:
      'You have come to Haunted Hollow because of a letter. The iron gate is chained and a note is nailed to it.',
    objective: 'Lift the latch and open the gate.',
    objectiveId: 'gate-open',
    done: 'The latch gives with a dry groan. Beyond the gate, the lane runs down into the fog.',
    next: 'Walk through the gate',
  },
  {
    id: 'grounds',
    title: 'The Grounds',
    intro:
      'Pumpkins sit in a crooked row beside the lane. Past them lie a churchyard and a street swallowed by mist.',
    objective: 'Light the five pumpkins in the right order.',
    objectiveId: 'pumpkins-lit',
    done: 'The last lantern catches. Somewhere in the hedge, a hidden door swings open.',
    next: 'Climb through the hidden door',
  },
  {
    id: 'attic',
    title: 'The Attic',
    intro:
      'Dust, a trunk, and a letter in your own name. Three candles are all that keep the dark back.',
    objective: 'Blow out all three candles.',
    objectiveId: 'candles-out',
    done: 'Darkness. Then, far below, the faint sound of a machine turning over.',
    next: 'Follow the sound to the castle',
  },
  {
    id: 'castle',
    title: 'The Castle',
    intro:
      'The castle waits on its hill. Its door stands ajar, and a stair leads down to the laboratory.',
    objective: 'In the laboratory, raise the voltage above 70 kV and pull the lever.',
    objectiveId: 'creature-awake',
    done: 'The coils sing. On the slab, something sits up and looks at you, not unkindly.',
    next: 'Climb to the archive',
  },
  {
    id: 'archive',
    title: 'The Archive',
    intro:
      'High above the lab, the keeper left a library and a stack of old news. Everything you saw here has an explanation.',
    objective: 'Turn at least one page of the grimoire.',
    objectiveId: 'page-turned',
    done: 'The page settles. That is the end of the night, and the start of the next one.',
    next: 'Return to the gate',
  },
];

export function chapterIndex(id: ChapterId): number {
  return CHAPTERS.findIndex((c) => c.id === id);
}
