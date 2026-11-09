import type { Settings } from '../core/settings';
import { effectiveReducedMotion } from '../a11y/reducedMotion';

export interface GhostLimits {
  enabled: boolean;
  max: number;
  minCooldownMs: number;
  maxCooldownMs: number;
  fadeOnly: boolean;
}

/** PLAN 5.1: max 3, cooldown 8 to 20 s, fade-only under reduced motion. Safe mode attenuates further. */
export function ghostLimits(s: Settings, osPref: boolean): GhostLimits {
  const reduced = effectiveReducedMotion(s, osPref);
  return {
    enabled: true,
    max: s.safeMode ? 1 : 3,
    minCooldownMs: s.safeMode ? 16000 : 8000,
    maxCooldownMs: s.safeMode ? 40000 : 20000,
    fadeOnly: reduced || s.safeMode,
  };
}

/** Bats are fast moving, so they are off under reduced motion or safe mode. */
export function batsAllowed(s: Settings, osPref: boolean): boolean {
  return !s.safeMode && !effectiveReducedMotion(s, osPref);
}

/** The spider's dangling animation is replaced by a static pose when motion is reduced. */
export function spiderAnimated(s: Settings, osPref: boolean): boolean {
  return !s.safeMode && !effectiveReducedMotion(s, osPref);
}
