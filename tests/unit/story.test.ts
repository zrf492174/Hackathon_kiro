import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/story/chapters';
import {
  STORY_KEY,
  advance,
  canVisit,
  chapterFromHash,
  initialState,
  isDone,
  loadState,
  markDone,
  open,
  parseState,
  saveState,
  visit,
} from '../../src/story/state';
import { chapterOfArea } from '../../src/scenes';

describe('story state', () => {
  it('has five chapters', () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual(['gate', 'grounds', 'attic', 'castle', 'archive']);
  });

  it('advances one chapter at a time and unlocks it', () => {
    let s = initialState();
    expect(canVisit(s, 1)).toBe(false);
    s = advance(s);
    expect(s).toMatchObject({ current: 1, reached: 1 });
    expect(canVisit(s, 1)).toBe(true);
    expect(canVisit(s, 2)).toBe(false);
  });

  it('refuses to visit locked chapters but lets reached ones be revisited', () => {
    let s = advance(advance(initialState()));
    expect(visit(s, 4)).toBe(s);
    s = visit(s, 0);
    expect(s.current).toBe(0);
    expect(s.reached).toBe(2);
  });

  it('wraps to the start after the last chapter and keeps progress', () => {
    let s = initialState();
    for (let i = 0; i < 4; i++) s = advance(s);
    expect(s.current).toBe(4);
    s = advance(s);
    expect(s).toMatchObject({ current: 0, reached: 4 });
  });

  it('marks objectives done once', () => {
    const s = markDone(initialState(), 'gate');
    expect(isDone(s, 0)).toBe(true);
    expect(markDone(s, 'gate')).toBe(s);
    expect(isDone(s, 1)).toBe(false);
  });

  it('persists and restores progress', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    saveState(storage, markDone(advance(initialState()), 'gate'));
    expect(store.has(STORY_KEY)).toBe(true);
    const back = loadState(storage);
    expect(back).toMatchObject({ current: 0, reached: 1, done: ['gate'] });
  });

  it('survives corrupt or hostile storage', () => {
    expect(parseState('{nope')).toEqual(initialState());
    expect(parseState('{"reached":99,"done":["gate","zzz"]}')).toMatchObject({
      reached: 4,
      done: ['gate'],
    });
    expect(parseState('{"reached":"x"}').reached).toBe(0);
    expect(loadState(null)).toEqual(initialState());
  });

  it('maps legacy scene ids to chapters', () => {
    expect(chapterFromHash('#patch')).toBe(1);
    expect(chapterFromHash('graveyard')).toBe(1);
    expect(chapterFromHash('#fog')).toBe(1);
    expect(chapterFromHash('#lab')).toBe(3);
    expect(chapterFromHash('#library')).toBe(4);
    expect(chapterFromHash('#gazette')).toBe(4);
    expect(chapterFromHash('#nope')).toBeNull();
    expect(chapterFromHash('#constructor')).toBeNull();
    expect(chapterOfArea('lab')).toBe('castle');
  });

  it('opens a deep-linked chapter and unlocks it', () => {
    const s = open(initialState(), 3);
    expect(s).toMatchObject({ current: 3, reached: 3 });
    expect(open(s, 9)).toBe(s);
  });
});
