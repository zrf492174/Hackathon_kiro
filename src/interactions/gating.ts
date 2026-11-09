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

/** The dark flashlight overlay is opt-in and off under safe mode or reduced motion. */
export function flashlightAllowed(s: Settings, osPref: boolean): boolean {
  return s.flashlight && !s.safeMode && !effectiveReducedMotion(s, osPref);
}

/** The spider's dangling animation is replaced by a static pose when motion is reduced. */
export function spiderAnimated(s: Settings, osPref: boolean): boolean {
  return !s.safeMode && !effectiveReducedMotion(s, osPref);
}

/** Lightning flashes and animated rain are off under safe mode or reduced motion. */
export function lightningAllowed(s: Settings, osPref: boolean): boolean {
  return !s.safeMode && !effectiveReducedMotion(s, osPref);
}

/** Thunder is a scare sound: only when scares are explicitly enabled. */
export function thunderAllowed(s: Settings): boolean {
  return s.scaresEnabled && !s.safeMode;
}

/** Eyes blink away with a quick fade; they stay static (no blink animation) otherwise. */
export function eyesAnimated(s: Settings, osPref: boolean): boolean {
  return !s.safeMode && !effectiveReducedMotion(s, osPref);
}

/** Ghost rain and the blood moon pulse are reduced to static visuals when motion is limited. */
export function eggMotionAllowed(s: Settings, osPref: boolean): boolean {
  return !s.safeMode && !effectiveReducedMotion(s, osPref);
}

/** Figure animations (wave, howl, head turn) only run when motion is allowed. */
export function figureMotionAllowed(s: Settings, osPref: boolean): boolean {
  return !s.safeMode && !effectiveReducedMotion(s, osPref);
}

/** A figure may lunge forward (one slow scale, never flashing) only when scares are enabled. */
export function figureLungeAllowed(s: Settings, osPref: boolean): boolean {
  return s.scaresEnabled && figureMotionAllowed(s, osPref);
}

/** The rusty siren may hum only when sound is on and scares are enabled. */
export function sirenSoundAllowed(s: Settings): boolean {
  return !s.muted && s.scaresEnabled && !s.safeMode;
}

/** Clamp a fog density value to 0..100; unparsable input falls back to 60. */
export function clampFogDensity(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number.parseFloat(String(raw));
  if (!Number.isFinite(n)) return 60;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Fog density is fixed (static) in safe mode or reduced motion; drifting is cosmetic only. */
export function fogDrifts(s: Settings, osPref: boolean): boolean {
  return !s.safeMode && !effectiveReducedMotion(s, osPref);
}

/** How long a revealed creature stays visible in the fog; shorter and fade-only in safe mode. */
export function revealDurationMs(s: Settings): number {
  return s.safeMode ? 2500 : 4500;
}

/** Voltage 0..100 to arc intensity 0..1; the arc is zero unless the lever is on. */
export function arcIntensity(voltage: unknown, live: boolean): number {
  if (!live) return 0;
  const n = typeof voltage === 'number' ? voltage : Number.parseFloat(String(voltage));
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n / 100));
}
