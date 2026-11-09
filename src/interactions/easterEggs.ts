import { eggMotionAllowed } from './gating';
import type { Interaction, InteractionContext } from './types';

export const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

/** Matches a sequence of keys; wrong keys restart (re-checking the key as a new start). */
export class SequenceMatcher {
  private pos = 0;
  constructor(
    private readonly seq: readonly string[],
    private readonly caseInsensitive = true,
  ) {}

  private norm(k: string): string {
    return this.caseInsensitive ? k.toLowerCase() : k;
  }

  /** Returns true when the full sequence has just been completed. */
  push(key: string): boolean {
    const k = this.norm(key);
    if (k === this.norm(this.seq[this.pos])) this.pos++;
    else this.pos = k === this.norm(this.seq[0]) ? 1 : 0;
    if (this.pos === this.seq.length) {
      this.pos = 0;
      return true;
    }
    return false;
  }

  reset(): void {
    this.pos = 0;
  }
}

/** Fires when `count` clicks land inside a rolling `windowMs` window. */
export class ClickBurst {
  private times: number[] = [];
  constructor(
    private readonly count = 7,
    private readonly windowMs = 10000,
  ) {}

  click(now: number): boolean {
    this.times = this.times.filter((t) => now - t <= this.windowMs);
    this.times.push(now);
    if (this.times.length >= this.count) {
      this.times = [];
      return true;
    }
    return false;
  }
}

let cleanup: (() => void) | null = null;
let nodes: HTMLElement[] = [];

export const easterEggs: Interaction = {
  init(ctx: InteractionContext) {
    easterEggs.destroy();
    const konami = new SequenceMatcher(KONAMI);
    const boo = new SequenceMatcher(['b', 'o', 'o']);
    const burst = new ClickBurst();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    const motion = () => eggMotionAllowed(ctx.settings.get(), ctx.osReducedMotion());
    const add = <T extends HTMLElement>(el: T): T => {
      nodes.push(el);
      document.body.appendChild(el);
      return el;
    };
    const drop = (el: HTMLElement) => {
      el.remove();
      nodes = nodes.filter((n) => n !== el);
    };

    const moon = add(document.createElement('button'));
    moon.type = 'button';
    moon.className = 'moon-btn';
    moon.setAttribute('aria-label', 'The moon');
    const moonImg = document.createElement('img');
    moonImg.alt = '';
    moonImg.src = ctx.assets.pick('scenery') ? moonUrl(ctx) : '';
    moon.appendChild(moonImg);

    const pumpkinKing = () => {
      const k = add(document.createElement('div'));
      k.className = 'pumpkin-king' + (motion() ? '' : ' pumpkin-king--static');
      k.setAttribute('role', 'status');
      k.textContent = 'All hail the Pumpkin King';
      ctx.announce('The Pumpkin King appears.');
      ctx.addScore(100);
      later(() => drop(k), 4000);
    };
    const bloodMoon = () => {
      const on = document.documentElement.classList.toggle('blood-moon');
      ctx.announce(on ? 'The moon turns red.' : 'The moon returns to normal.');
      if (on) ctx.addScore(25);
    };
    const ghostRain = () => {
      ctx.announce('Ghosts rain from the sky.');
      const url = ctx.assets.pick('ghosts') ?? '';
      const n = motion() ? 12 : 4;
      for (let i = 0; i < n; i++) {
        const g = add(document.createElement('img'));
        g.alt = '';
        g.src = url;
        g.setAttribute('aria-hidden', 'true');
        g.className = 'rain-ghost' + (motion() ? '' : ' rain-ghost--static');
        g.style.left = `${Math.random() * 92}%`;
        g.style.animationDelay = `${(i * 0.25).toFixed(2)}s`;
        later(() => drop(g), 5000);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && t.closest('input, textarea, select')) return;
      if (konami.push(e.key)) pumpkinKing();
      if (boo.push(e.key)) ghostRain();
    };
    const onMoon = () => {
      if (burst.click(Date.now())) bloodMoon();
    };
    document.addEventListener('keydown', onKey);
    moon.addEventListener('click', onMoon);
    cleanup = () => {
      document.removeEventListener('keydown', onKey);
      moon.removeEventListener('click', onMoon);
      for (const t of timers) clearTimeout(t);
      timers.clear();
      document.documentElement.classList.remove('blood-moon');
    };
  },
  destroy() {
    cleanup?.();
    cleanup = null;
    for (const n of nodes) n.remove();
    nodes = [];
  },
};

function moonUrl(ctx: InteractionContext): string {
  return (
    ctx.assets.urls('scenery').find((u) => u.endsWith('moon.svg')) ??
    ctx.assets.pick('scenery') ??
    ''
  );
}
