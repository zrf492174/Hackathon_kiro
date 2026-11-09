import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GhostScheduler } from '../../src/interactions/ghostScheduler';
import { canFlash, nextLightningDelay } from '../../src/interactions/lightning';
import { withinRange } from '../../src/interactions/eyes';
import { brightnessFor } from '../../src/interactions/candles';
import { ClickBurst, KONAMI, SequenceMatcher } from '../../src/interactions/easterEggs';
import {
  eggMotionAllowed,
  eyesAnimated,
  lightningAllowed,
  thunderAllowed,
  ghostLimits,
} from '../../src/interactions/gating';
import { CollectionStore, parseCollection } from '../../src/core/collection';
import { discoveredRecords } from '../../src/ui/collectionBook';
import { parseSceneId } from '../../src/scenes';
import { DEFAULT_SETTINGS, type Settings } from '../../src/core/settings';
import { AssetLibrary, type AssetRecord } from '../../src/core/assets';

const s = (p: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...p });

describe('ghost scheduler cleanup', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  it('stop() leaves no pending timers and no further spawns', () => {
    const spawn = vi.fn();
    const sch = new GhostScheduler({ limits: () => ghostLimits(s(), false), spawn });
    sch.start();
    sch.stop();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(120000);
    expect(spawn).not.toHaveBeenCalled();
  });
});

describe('lightning helpers', () => {
  it('delay stays within 15 to 40 s', () => {
    expect(nextLightningDelay(() => 0)).toBe(15000);
    expect(nextLightningDelay(() => 1)).toBe(40000);
  });
  it('limits to 3 flashes per second', () => {
    expect(canFlash([0, 100, 200], 300)).toBe(false);
    expect(canFlash([0, 100, 200], 1100)).toBe(true);
    expect(canFlash([], 0)).toBe(true);
  });
  it('is gated by safe mode, reduced motion and scares opt-in', () => {
    expect(lightningAllowed(s(), false)).toBe(true);
    expect(lightningAllowed(s({ safeMode: true }), false)).toBe(false);
    expect(lightningAllowed(s({ reducedMotion: true }), false)).toBe(false);
    expect(lightningAllowed(s(), true)).toBe(false);
    expect(thunderAllowed(s())).toBe(false);
    expect(thunderAllowed(s({ scaresEnabled: true }))).toBe(true);
    expect(thunderAllowed(s({ scaresEnabled: true, safeMode: true }))).toBe(false);
    expect(eyesAnimated(s({ safeMode: true }), false)).toBe(false);
    expect(eggMotionAllowed(s(), true)).toBe(false);
  });
});

describe('eyes and candles', () => {
  it('detects proximity', () => {
    expect(withinRange(0, 0, 50, 50)).toBe(true);
    expect(withinRange(0, 0, 200, 200)).toBe(false);
  });
  it('maps lit candles to brightness', () => {
    expect(brightnessFor(3)).toBe(1);
    expect(brightnessFor(0)).toBeCloseTo(0.35);
    expect(brightnessFor(99)).toBe(1);
  });
});

describe('easter egg matchers', () => {
  it('matches the Konami code', () => {
    const m = new SequenceMatcher(KONAMI);
    const hits = KONAMI.map((k) => m.push(k));
    expect(hits.at(-1)).toBe(true);
    expect(hits.slice(0, -1).some(Boolean)).toBe(false);
  });
  it('restarts on a wrong key', () => {
    const m = new SequenceMatcher(KONAMI);
    ['ArrowUp', 'ArrowUp', 'x'].forEach((k) => m.push(k));
    expect(KONAMI.map((k) => m.push(k)).at(-1)).toBe(true);
  });
  it('matches boo, case insensitive, with restart on repeated b', () => {
    const m = new SequenceMatcher(['b', 'o', 'o']);
    expect(['b', 'b', 'O', 'o'].map((k) => m.push(k)).at(-1)).toBe(true);
    expect(['b', 'o', 'x'].map((k) => m.push(k)).some(Boolean)).toBe(false);
  });
  it('detects 7 clicks within 10 s only', () => {
    const b = new ClickBurst();
    const fast = [0, 1, 2, 3, 4, 5, 6].map((i) => b.click(i * 1000));
    expect(fast.at(-1)).toBe(true);
    const slow = new ClickBurst();
    expect([0, 3, 6, 9, 12, 15, 18].map((i) => slow.click(i * 1000)).some(Boolean)).toBe(false);
  });
});

describe('collection store', () => {
  const mem = () => {
    const d = new Map<string, string>();
    return {
      getItem: (k: string) => d.get(k) ?? null,
      setItem: (k: string, v: string) => void d.set(k, v),
    };
  };
  it('persists unique ids and notifies once', () => {
    const storage = mem();
    const a = new CollectionStore(storage);
    const fn = vi.fn();
    a.subscribe(fn);
    expect(a.add('x')).toBe(true);
    expect(a.add('x')).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(new CollectionStore(storage).has('x')).toBe(true);
  });
  it('survives corrupt data and throwing storage', () => {
    expect(parseCollection('{bad')).toEqual([]);
    expect(parseCollection('[1,"a","a"]')).toEqual(['a']);
    const bad = {
      getItem: () => {
        throw new Error('no');
      },
      setItem: () => {
        throw new Error('no');
      },
    };
    const c = new CollectionStore(bad);
    expect(c.add('y')).toBe(true);
    expect(c.list()).toEqual(['y']);
  });
  it('filters records and resolves urls', () => {
    const rec = (id: string, file: string): AssetRecord => ({
      id,
      type: 'image',
      category: 'ghosts',
      file,
      title: id,
      author: 'a',
      license: 'CC0-1.0',
      status: 'approved',
    });
    const recs = [rec('a', 'placeholders/ghost.svg'), rec('b', 'placeholders/bat.svg')];
    expect(discoveredRecords(recs, ['b']).map((r) => r.id)).toEqual(['b']);
    const lib = new AssetLibrary({ version: 1, assets: recs }, '/');
    expect(lib.recordForUrl('/assets/placeholders/ghost.svg')?.id).toBe('a');
    expect(lib.recordForUrl('/assets/nope.svg')).toBeNull();
  });
});

describe('scene ids', () => {
  it('defaults to gate', () => {
    expect(parseSceneId('#attic')).toBe('attic');
    expect(parseSceneId('bogus')).toBe('gate');
    expect(parseSceneId(null)).toBe('gate');
  });
});
