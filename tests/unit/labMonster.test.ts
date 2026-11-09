import { describe, expect, it } from 'vitest';
import {
  SIT_MS,
  WALK_MAX_X,
  WALK_MIN_X,
  monsterShouldRise,
  nextPhase,
  pickTarget,
  stepToward,
} from '../../src/interactions/labMonster';

describe('lab monster', () => {
  it('rises only strictly above 70 with the lever on', () => {
    expect(monsterShouldRise(70, true)).toBe(false);
    expect(monsterShouldRise('75', true)).toBe(true);
    expect(monsterShouldRise(100, false)).toBe(false);
    expect(monsterShouldRise('abc', true)).toBe(false);
  });
  it('moves lying -> sitting -> walking and back', () => {
    expect(nextPhase('lying', true, true, 0)).toBe('sitting');
    expect(nextPhase('sitting', true, true, SIT_MS - 1)).toBe('sitting');
    expect(nextPhase('sitting', true, true, SIT_MS)).toBe('walking');
    expect(nextPhase('walking', false, true, 0)).toBe('lying');
    expect(nextPhase('sitting', false, true, 0)).toBe('lying');
  });
  it('only sits when motion is not allowed', () => {
    expect(nextPhase('sitting', true, false, SIT_MS * 2)).toBe('sitting');
    expect(nextPhase('walking', true, false, 0)).toBe('sitting');
  });
  it('picks targets inside the bounds', () => {
    for (const r of [0, 0.5, 1]) {
      for (const x of [WALK_MIN_X, 300, WALK_MAX_X]) {
        const t = pickTarget(x, () => r);
        expect(t).toBeGreaterThanOrEqual(WALK_MIN_X);
        expect(t).toBeLessThanOrEqual(WALK_MAX_X);
      }
    }
  });
  it('steps without overshooting', () => {
    expect(stepToward(100, 200, 30)).toBe(130);
    expect(stepToward(100, 90, 30)).toBe(90);
    expect(stepToward(100, 100, 5)).toBe(100);
  });
});
