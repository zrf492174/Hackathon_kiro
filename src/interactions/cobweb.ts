import { spiderAnimated } from './gating';
import type { Interaction, InteractionContext } from './types';

const NEAR_PX = 140;
let wrap: HTMLElement | null = null;
let cleanup: (() => void) | null = null;

/** True when the pointer is within `radius` of the spider's centre. */
export function isNear(px: number, py: number, sx: number, sy: number, radius = NEAR_PX): boolean {
  return Math.hypot(px - sx, py - sy) < radius;
}

export const cobweb: Interaction = {
  init(ctx: InteractionContext) {
    cobweb.destroy();
    const [webUrl, spiderUrl] = ctx.assets.urls('webs');
    const el = document.createElement('div');
    el.className = 'cobweb';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<img class="cobweb__web" alt="" /><span class="cobweb__thread"></span><img class="cobweb__spider" alt="" />`;
    (el.querySelector('.cobweb__web') as HTMLImageElement).src = webUrl ?? '';
    const spider = el.querySelector('.cobweb__spider') as HTMLImageElement;
    spider.src = spiderUrl ?? webUrl ?? '';
    ctx.root.appendChild(el);
    wrap = el;
    const update = () => {
      el.dataset.animated = String(spiderAnimated(ctx.settings.get(), ctx.osReducedMotion()));
    };
    update();
    const unsub = ctx.settings.subscribe(update);
    const move = (e: PointerEvent) => {
      const r = spider.getBoundingClientRect();
      const near = isNear(e.clientX, e.clientY, r.left + r.width / 2, r.top + r.height / 2);
      el.classList.toggle('cobweb--retracted', near);
    };
    window.addEventListener('pointermove', move, { passive: true });
    cleanup = () => {
      window.removeEventListener('pointermove', move);
      unsub();
    };
  },
  destroy() {
    cleanup?.();
    cleanup = null;
    wrap?.remove();
    wrap = null;
  },
};
