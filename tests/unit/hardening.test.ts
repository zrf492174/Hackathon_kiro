import { describe, expect, it } from 'vitest';
import { extensionForType } from '../../scripts/collect';
import { DEFAULT_SETTINGS } from '../../src/core/settings';
import { flashlightAllowed } from '../../src/interactions/gating';

describe('extensionForType', () => {
  it('maps image types and rejects others', () => {
    expect(extensionForType('image/jpeg; charset=x')).toBe('.jpg');
    expect(extensionForType('IMAGE/PNG')).toBe('.png');
    expect(extensionForType('text/html')).toBeNull();
    expect(extensionForType(null)).toBeNull();
  });
});

describe('flashlightAllowed', () => {
  const on = { ...DEFAULT_SETTINGS, flashlight: true };
  it('is opt-in', () => {
    expect(flashlightAllowed(DEFAULT_SETTINGS, false)).toBe(false);
    expect(flashlightAllowed(on, false)).toBe(true);
  });
  it('is off in safe mode or reduced motion', () => {
    expect(flashlightAllowed({ ...on, safeMode: true }, false)).toBe(false);
    expect(flashlightAllowed({ ...on, reducedMotion: true }, false)).toBe(false);
    expect(flashlightAllowed(on, true)).toBe(false);
  });
});
