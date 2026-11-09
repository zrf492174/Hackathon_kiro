import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PumpkinPuzzle } from '../../src/interactions/pumpkinPuzzle';
import { GhostScheduler } from '../../src/interactions/ghostScheduler';
import { batsAllowed, ghostLimits, spiderAnimated } from '../../src/interactions/gating';
import { isNear } from '../../src/interactions/cobweb';
import { DEFAULT_SETTINGS, type Settings } from '../../src/core/settings';

const s = (p: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...p });

describe('PumpkinPuzzle', () => {
  it('solves when lit in order', () => {
    const p = new PumpkinPuzzle([2, 0, 4, 1, 3]);
    expect([2, 0, 4, 1].map((i) => p.press(i))).toEqual(['lit', 'lit', 'lit', 'lit']);
    expect(p.press(3)).toBe('solved');
    expect(p.solved).toBe(true);
  });
  it('resets on wrong order', () => {
    const p = new PumpkinPuzzle([2, 0, 4, 1, 3]);
    p.press(2);
    expect(p.press(1)).toBe('reset');
    expect(p.state.every((x) => !x)).toBe(true);
    expect(p.press(2)).toBe('lit');
  });
  it('resets when unlighting before solved', () => {
    const p = new PumpkinPuzzle([0, 1, 2, 3, 4]);
    p.press(0);
    expect(p.press(0)).toBe('reset');
  });
  it('toggles freely after solved and rejects bad index', () => {
    const p = new PumpkinPuzzle([0, 1, 2, 3, 4]);
    [0, 1, 2, 3, 4].forEach((i) => p.press(i));
    expect(p.press(0)).toBe('unlit');
    expect(p.press(0)).toBe('lit');
    expect(p.solved).toBe(true);
    expect(() => p.press(9)).toThrow(RangeError);
  });
});

describe('GhostScheduler', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const make = (settings: Settings, rng = () => 0) => {
    const spawn = vi.fn();
    const sch = new GhostScheduler({ limits: () => ghostLimits(settings, false), spawn, rng });
    return { sch, spawn };
  };

  it('respects cooldown between 8 and 20 s', () => {
    const { sch } = make(s(), () => 0);
    expect(sch.nextDelay()).toBe(8000);
    const hi = make(s(), () => 1).sch;
    expect(hi.nextDelay()).toBe(20000);
  });
  it('spawns after cooldown and never exceeds 3', () => {
    const { sch, spawn } = make(s());
    sch.start();
    vi.advanceTimersByTime(7999);
    expect(spawn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(spawn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(8000 * 10);
    expect(spawn).toHaveBeenCalledTimes(3);
    expect(sch.activeCount).toBe(3);
    sch.released();
    vi.advanceTimersByTime(8000);
    expect(spawn).toHaveBeenCalledTimes(4);
    sch.stop();
  });
  it('pauses while hidden and resumes', () => {
    const { sch, spawn } = make(s());
    sch.start();
    sch.setPaused(true);
    vi.advanceTimersByTime(60000);
    expect(spawn).not.toHaveBeenCalled();
    sch.setPaused(false);
    vi.advanceTimersByTime(8000);
    expect(spawn).toHaveBeenCalledTimes(1);
    sch.stop();
  });
  it('safe mode allows only one ghost', () => {
    const { sch, spawn } = make(s({ safeMode: true }));
    sch.start();
    vi.advanceTimersByTime(16000 * 5);
    expect(spawn).toHaveBeenCalledTimes(1);
    sch.stop();
  });
});

describe('settings gating', () => {
  it('ghosts fade only under reduced motion (user or OS)', () => {
    expect(ghostLimits(s(), false).fadeOnly).toBe(false);
    expect(ghostLimits(s({ reducedMotion: true }), false).fadeOnly).toBe(true);
    expect(ghostLimits(s(), true).fadeOnly).toBe(true);
    expect(ghostLimits(s(), false).max).toBe(3);
  });
  it('bats and spider animation are off with reduced motion or safe mode', () => {
    expect(batsAllowed(s(), false)).toBe(true);
    expect(batsAllowed(s({ reducedMotion: true }), false)).toBe(false);
    expect(batsAllowed(s({ safeMode: true }), false)).toBe(false);
    expect(batsAllowed(s(), true)).toBe(false);
    expect(spiderAnimated(s(), false)).toBe(true);
    expect(spiderAnimated(s({ safeMode: true }), false)).toBe(false);
  });
});

describe('cobweb proximity', () => {
  it('detects near pointer', () => {
    expect(isNear(0, 0, 50, 50)).toBe(true);
    expect(isNear(0, 0, 500, 500)).toBe(false);
  });
});
