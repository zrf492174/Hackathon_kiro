import { describe, expect, it } from 'vitest';
import {
  FOG_LAYERS,
  FOG_TINTS,
  fbm,
  groundDensity,
  hash2,
  tintFor,
  valueNoise,
} from '../../src/core/fog';

describe('fog noise', () => {
  it('hash is deterministic and in range', () => {
    expect(hash2(3, 4)).toBe(hash2(3, 4));
    expect(hash2(3, 4)).not.toBe(hash2(4, 3));
    for (let i = 0; i < 50; i++) {
      const h = hash2(i, -i, 7);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
    }
  });

  it('value noise matches the lattice and is continuous', () => {
    expect(valueNoise(2, 5)).toBeCloseTo(hash2(2, 5));
    expect(Math.abs(valueNoise(2.5, 5.5) - valueNoise(2.501, 5.5))).toBeLessThan(0.01);
  });

  it('fbm stays in [0, 1)', () => {
    for (let i = 0; i < 100; i++) {
      const n = fbm(i * 0.37, i * 0.11, 3, 1);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it('fog is denser near the ground and absent above the horizon', () => {
    expect(groundDensity(0.2, 0.5)).toBe(0);
    expect(groundDensity(0.7, 0.5)).toBeLessThan(groundDensity(0.95, 0.5));
    expect(groundDensity(1, 0.5)).toBe(1);
  });

  it('has three parallax layers, nearer ones faster', () => {
    expect(FOG_LAYERS).toHaveLength(3);
    expect(FOG_LAYERS[2].speed).toBeGreaterThan(FOG_LAYERS[0].speed);
  });

  it('tints by chapter with a fallback', () => {
    expect(tintFor('grounds')).toBe(FOG_TINTS.grounds);
    expect(tintFor('nope')).toBe(FOG_TINTS.gate);
    expect(tintFor(undefined)).toBe(FOG_TINTS.gate);
    expect(FOG_TINTS.grounds.amount).toBeGreaterThan(FOG_TINTS.archive.amount);
  });
});
