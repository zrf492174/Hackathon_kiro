import { figureMotionAllowed } from './gating';
import type { Interaction } from './types';

/** The creature rises only when voltage is strictly above this value (and the lever is on). */
export const SIT_THRESHOLD = 70;
/** How long the creature stays seated before it starts to wander. */
export const SIT_MS = 1500;
/** Walkable x range (SVG units) on the lab floor, clear of the coils. */
export const WALK_MIN_X = 110;
export const WALK_MAX_X = 500;
/** Walking speed in SVG units per second. */
export const WALK_SPEED = 45;
const SEAT = { x: 300, y: 308 };
const FLOOR_Y = 348;

export type MonsterPhase = 'lying' | 'sitting' | 'walking';

/** True when voltage exceeds 70 and the lever is on. */
export function monsterShouldRise(voltage: unknown, live: boolean): boolean {
  if (!live) return false;
  const n = typeof voltage === 'number' ? voltage : Number.parseFloat(String(voltage));
  return Number.isFinite(n) && n > SIT_THRESHOLD;
}

/** Pure phase machine. Walking requires motion to be allowed; otherwise the creature just sits. */
export function nextPhase(
  phase: MonsterPhase,
  rise: boolean,
  canWalk: boolean,
  seatedMs: number,
): MonsterPhase {
  if (!rise) return 'lying';
  if (phase === 'lying') return 'sitting';
  if (phase === 'sitting') return canWalk && seatedMs >= SIT_MS ? 'walking' : 'sitting';
  return canWalk ? 'walking' : 'sitting';
}

/** Random wander target inside the lab bounds, at least 60 units from the current x. */
export function pickTarget(x: number, rand: () => number): number {
  const span = WALK_MAX_X - WALK_MIN_X;
  let t = WALK_MIN_X + rand() * span;
  if (Math.abs(t - x) < 60) t = x - WALK_MIN_X > span / 2 ? x - 60 : x + 60;
  return Math.min(WALK_MAX_X, Math.max(WALK_MIN_X, t));
}

/** Move x toward target by at most dist without overshooting. */
export function stepToward(x: number, target: number, dist: number): number {
  const d = target - x;
  return Math.abs(d) <= dist ? target : x + Math.sign(d) * dist;
}

const MESSAGES: Record<MonsterPhase, string> = {
  lying: 'The creature lies back down.',
  sitting: 'The creature sits up.',
  walking: 'The creature climbs down and wanders the lab.',
};

let cleanup: (() => void) | null = null;

/** Above 70 kV with the lever on, the creature sits up and then wanders the lab at random. */
export const labMonster: Interaction = {
  init(ctx) {
    labMonster.destroy();
    const root = ctx.root;
    const walker = root.querySelector<SVGGElement>('.lab__walker');
    const flip = root.querySelector<SVGGElement>('.lab__walker-flip');
    const input = root.querySelector<HTMLInputElement>('.lab__volt input');
    if (!walker || !flip || !input) return;

    let phase: MonsterPhase = 'lying';
    let x = SEAT.x;
    let target = x;
    let dir = 1;
    let pause = 0;
    let seatedMs = 0;
    let raf = 0;
    let sitTimer = 0;
    let last = 0;

    const canWalk = () => figureMotionAllowed(ctx.settings.get(), ctx.osReducedMotion());
    const place = (y: number) => {
      walker.style.transform = `translate(${x}px, ${y}px)`;
      flip.style.transform = `scaleX(${dir})`;
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      clearTimeout(sitTimer);
      raf = 0;
      sitTimer = 0;
    };
    const tick = (now: number) => {
      raf = 0;
      if (phase !== 'walking' || document.hidden) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!canWalk()) {
        set(nextPhase(phase, true, false, seatedMs));
        return;
      }
      if (pause > 0) pause -= dt;
      else if (x === target) {
        target = pickTarget(x, Math.random);
        dir = target > x ? 1 : -1;
        root.classList.add('lab--walking');
      } else {
        x = stepToward(x, target, WALK_SPEED * dt);
        if (x === target) {
          pause = 0.5 + Math.random() * 1.5;
          root.classList.remove('lab--walking');
        }
      }
      place(FLOOR_Y);
      raf = requestAnimationFrame(tick);
    };
    const run = () => {
      if (phase === 'walking' && !raf && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    function set(next: MonsterPhase) {
      if (next === phase) return;
      const prev = phase;
      phase = next;
      stop();
      root.classList.toggle('lab--awake', phase !== 'lying');
      root.classList.toggle('lab--walking', phase === 'walking');
      let msg = MESSAGES[phase];
      if (phase === 'sitting' && prev === 'walking') {
        x = SEAT.x;
        msg = 'The creature returns to the slab and sits.';
      } else if (phase === 'sitting' && !canWalk()) msg += ' Animation is off.';
      if (phase === 'lying') x = SEAT.x;
      dir = 1;
      if (phase === 'walking') {
        target = x;
        pause = 0;
      }
      place(phase === 'walking' ? FLOOR_Y : SEAT.y);
      if (phase === 'sitting') {
        seatedMs = 0;
        if (canWalk()) {
          sitTimer = window.setTimeout(() => {
            seatedMs = SIT_MS;
            sync();
          }, SIT_MS);
        }
      }
      ctx.announce(msg);
      run();
    }
    function sync() {
      const rise = monsterShouldRise(input!.value, root.classList.contains('lab--live'));
      set(nextPhase(phase, rise, canWalk(), seatedMs));
    }
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else run();
    };
    input.addEventListener('input', sync);
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', onVis);
    place(SEAT.y);
    cleanup = () => {
      stop();
      mo.disconnect();
      input.removeEventListener('input', sync);
      document.removeEventListener('visibilitychange', onVis);
      root.classList.remove('lab--awake', 'lab--walking');
    };
  },
  destroy() {
    cleanup?.();
    cleanup = null;
  },
};
