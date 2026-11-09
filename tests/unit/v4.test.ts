import { describe, expect, it } from 'vitest';
import {
  arcIntensity,
  clampFogDensity,
  figureLungeAllowed,
  figureMotionAllowed,
  revealDurationMs,
  sirenSoundAllowed,
} from '../../src/interactions/gating';
import { FIGURES, SCENE_FIGURES, figuresForScene } from '../../src/interactions/figures';
import {
  FOG_CREATURES,
  isRevealActive,
  nextCreature,
  pointerNear,
} from '../../src/interactions/fogCreatures';
import { STONES, epitaphText, stoneById } from '../../src/interactions/graveyardStones';
import { SCENES, SCENE_GROUPS, parseSceneId } from '../../src/scenes';
import { DEFAULT_SETTINGS, type Settings } from '../../src/core/settings';

const s = (p: Partial<Settings> = {}): Settings => ({ ...DEFAULT_SETTINGS, ...p });

describe('v4 gating', () => {
  it('figure motion is off in safe mode or reduced motion', () => {
    expect(figureMotionAllowed(s(), false)).toBe(true);
    expect(figureMotionAllowed(s({ safeMode: true }), false)).toBe(false);
    expect(figureMotionAllowed(s(), true)).toBe(false);
  });
  it('lunge needs scares and motion', () => {
    expect(figureLungeAllowed(s(), false)).toBe(false);
    expect(figureLungeAllowed(s({ scaresEnabled: true }), false)).toBe(true);
    expect(figureLungeAllowed(s({ scaresEnabled: true }), true)).toBe(false);
  });
  it('siren needs sound on and scares', () => {
    expect(sirenSoundAllowed(s({ scaresEnabled: true }))).toBe(true);
    expect(sirenSoundAllowed(s({ scaresEnabled: true, muted: true }))).toBe(false);
    expect(sirenSoundAllowed(s({ scaresEnabled: true, safeMode: true }))).toBe(false);
    expect(sirenSoundAllowed(s())).toBe(false);
  });
  it('clamps fog density and arc intensity', () => {
    expect(clampFogDensity(150)).toBe(100);
    expect(clampFogDensity('-5')).toBe(0);
    expect(clampFogDensity('abc')).toBe(60);
    expect(arcIntensity(50, true)).toBe(0.5);
    expect(arcIntensity(50, false)).toBe(0);
    expect(arcIntensity('x', true)).toBe(0);
    expect(arcIntensity(500, true)).toBe(1);
  });
  it('reveal lasts shorter in safe mode', () => {
    expect(revealDurationMs(s({ safeMode: true }))).toBeLessThan(revealDurationMs(s()));
  });
});

describe('v4 registries', () => {
  it('every scene figure id exists and has a label and caption', () => {
    for (const ids of Object.values(SCENE_FIGURES))
      for (const id of ids) expect(FIGURES[id]).toBeTruthy();
    for (const f of Object.values(FIGURES)) {
      expect(f.label.length).toBeGreaterThan(3);
      expect(f.caption.length).toBeGreaterThan(10);
    }
    expect(figuresForScene('castle').length).toBe(2);
    expect(figuresForScene('nowhere')).toEqual([]);
  });
  it('fog creatures rotate and time out', () => {
    expect(FOG_CREATURES.length).toBeGreaterThanOrEqual(7);
    const a = nextCreature('listen', 0);
    expect(nextCreature('listen', 0).id).toBe(a.id);
    expect(nextCreature('listen', 1).id).not.toBe(a.id);
    expect(nextCreature('search', -1)).toBeTruthy();
    expect(isRevealActive(1000, 1500, 4500)).toBe(true);
    expect(isRevealActive(1000, 6000, 4500)).toBe(false);
    expect(pointerNear({ x: 10, y: 10, w: 10 }, 15, 15)).toBe(true);
    expect(pointerNear({ x: 10, y: 10, w: 10 }, 90, 90)).toBe(false);
  });
  it('tombstones have epitaphs', () => {
    expect(STONES.length).toBeGreaterThanOrEqual(8);
    expect(epitaphText(stoneById('b')!)).toContain('Mirabel');
    expect(stoneById('zzz')).toBeUndefined();
  });
  it('nav groups cover all scenes including fog', () => {
    expect(SCENE_GROUPS).toHaveLength(2);
    expect(SCENES).toHaveLength(9);
    expect(parseSceneId('#fog')).toBe('fog');
  });
});
