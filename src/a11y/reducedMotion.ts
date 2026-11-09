import type { Settings } from '../core/settings';
import { flashingAllowed } from '../core/settings';

const QUERY = '(prefers-reduced-motion: reduce)';

export function osPrefersReducedMotion(win: Pick<Window, 'matchMedia'> = window): boolean {
  return typeof win.matchMedia === 'function' && win.matchMedia(QUERY).matches;
}

/** Reduced motion is on if the user chose it or the OS asks for it. */
export function effectiveReducedMotion(s: Settings, osPref: boolean): boolean {
  return s.reducedMotion || osPref;
}

/** Mirrors settings onto <html> data attributes that CSS keys off. */
export function applyMotionAttributes(s: Settings, osPref: boolean, root: HTMLElement): void {
  const reduced = effectiveReducedMotion(s, osPref);
  root.dataset.reducedMotion = String(reduced);
  root.dataset.safeMode = String(s.safeMode);
  root.dataset.flashing = String(flashingAllowed({ ...s, reducedMotion: reduced }));
}
