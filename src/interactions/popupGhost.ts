import { GhostScheduler } from './ghostScheduler';
import { ghostLimits } from './gating';
import type { Interaction, InteractionContext } from './types';

const LIFETIME_MS = 9000;

let scheduler: GhostScheduler | null = null;
let layer: HTMLElement | null = null;
let onVisibility: (() => void) | null = null;
const timers = new Set<ReturnType<typeof setTimeout>>();

function later(fn: () => void, ms: number): ReturnType<typeof setTimeout> {
  const t = setTimeout(() => {
    timers.delete(t);
    fn();
  }, ms);
  timers.add(t);
  return t;
}

export const popupGhost: Interaction = {
  init(ctx: InteractionContext) {
    popupGhost.destroy();
    const host = document.createElement('div');
    host.className = 'ghost-layer';
    host.setAttribute('aria-label', 'Wandering ghosts');
    ctx.root.appendChild(host);
    layer = host;
    const sched = new GhostScheduler({
      limits: () => ghostLimits(ctx.settings.get(), ctx.osReducedMotion()),
      spawn: () => spawnGhost(ctx, host, sched),
    });
    scheduler = sched;
    onVisibility = () => sched.setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    sched.setPaused(document.hidden);
    sched.start();
  },
  destroy() {
    scheduler?.stop();
    scheduler = null;
    if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
    onVisibility = null;
    for (const t of timers) clearTimeout(t);
    timers.clear();
    layer?.remove();
    layer = null;
  },
};

function spawnGhost(ctx: InteractionContext, host: HTMLElement, sched: GhostScheduler): void {
  const limits = ghostLimits(ctx.settings.get(), ctx.osReducedMotion());
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ghost' + (limits.fadeOnly ? ' ghost--fade' : '');
  btn.setAttribute('aria-label', 'Banish the ghost');
  const img = document.createElement('img');
  img.alt = '';
  const url = ctx.assets.pick('ghosts') ?? '';
  img.src = url;
  ctx.discover?.(url);
  btn.appendChild(img);
  btn.style.top = `${10 + Math.random() * 60}%`;
  btn.style.left = `${5 + Math.random() * 80}%`;
  host.appendChild(btn);
  ctx.announce('A ghost appears. Activate it to banish it.');
  if (!limits.fadeOnly && ctx.settings.get().scaresEnabled) ctx.audio.play('boo');

  let done = false;
  const finish = (banished: boolean) => {
    if (done) return;
    done = true;
    clearTimeout(timeout);
    btn.classList.add('ghost--out');
    later(() => btn.remove(), 600);
    sched.released();
    if (banished) {
      ctx.addScore(10);
      ctx.announce('Ghost banished. Plus 10.');
    }
  };
  btn.addEventListener('click', () => finish(true));
  const timeout = later(() => finish(false), LIFETIME_MS);
}
