import { CHAPTERS, type ChapterId } from './chapters';

export const STORY_KEY = 'hollow:story';

export interface StoryState {
  /** Index of the chapter being shown. */
  current: number;
  /** Highest chapter index the visitor has reached. */
  reached: number;
  /** Chapter ids whose objective is complete. */
  done: ChapterId[];
}

export interface StoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** Scene ids from older versions (and the new area ids) mapped to the chapter that now contains them. */
const LEGACY: Record<string, ChapterId> = {
  gate: 'gate',
  grounds: 'grounds',
  patch: 'grounds',
  graveyard: 'grounds',
  fog: 'grounds',
  attic: 'attic',
  castle: 'castle',
  lab: 'castle',
  archive: 'archive',
  library: 'archive',
  gazette: 'archive',
};

export function initialState(): StoryState {
  return { current: 0, reached: 0, done: [] };
}

/** Resolve a URL hash or legacy scene id to a chapter index, or null when unknown. */
export function chapterFromHash(raw: string | null | undefined): number | null {
  const id = (raw ?? '').replace(/^#/, '');
  const chapter = Object.prototype.hasOwnProperty.call(LEGACY, id) ? LEGACY[id] : undefined;
  return chapter ? CHAPTERS.findIndex((c) => c.id === chapter) : null;
}

export function canVisit(state: StoryState, index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < CHAPTERS.length && index <= state.reached;
}

/** Move to a chapter that has been reached. Returns the same state when it is locked. */
export function visit(state: StoryState, index: number): StoryState {
  return canVisit(state, index) ? { ...state, current: index } : state;
}

export function isDone(state: StoryState, index = state.current): boolean {
  const c = CHAPTERS[index];
  return !!c && state.done.includes(c.id);
}

export function markDone(state: StoryState, id: ChapterId): StoryState {
  return state.done.includes(id) ? state : { ...state, done: [...state.done, id] };
}

/** Advance to the next chapter, unlocking it. After the last chapter the story starts over (progress is kept). */
export function advance(state: StoryState): StoryState {
  if (state.current >= CHAPTERS.length - 1) return { ...state, current: 0 };
  const current = state.current + 1;
  return { ...state, current, reached: Math.max(state.reached, current) };
}

/** Force a chapter open, as when a deep link names it. */
export function open(state: StoryState, index: number): StoryState {
  if (index < 0 || index >= CHAPTERS.length) return state;
  return { ...state, current: index, reached: Math.max(state.reached, index) };
}

export function parseState(raw: string | null): StoryState {
  const s = initialState();
  if (!raw) return s;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return s;
    const rec = data as Record<string, unknown>;
    const reached = rec.reached;
    if (typeof reached === 'number' && Number.isInteger(reached)) {
      s.reached = Math.min(Math.max(reached, 0), CHAPTERS.length - 1);
    }
    if (Array.isArray(rec.done)) {
      s.done = CHAPTERS.map((c) => c.id).filter((id) => (rec.done as unknown[]).includes(id));
    }
  } catch {
    // corrupt data: start fresh
  }
  return s;
}

export function loadState(storage: StoryStorage | null): StoryState {
  try {
    return parseState(storage?.getItem(STORY_KEY) ?? null);
  } catch {
    return initialState();
  }
}

export function saveState(storage: StoryStorage | null, state: StoryState): void {
  try {
    storage?.setItem(STORY_KEY, JSON.stringify({ reached: state.reached, done: state.done }));
  } catch {
    // storage unavailable: progress lives in memory only
  }
}
