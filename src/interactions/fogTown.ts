import { clampFogDensity, revealDurationMs, sirenSoundAllowed } from './gating';
import { FOG_CREATURES, nextCreature, pointerNear, type RevealKind } from './fogCreatures';
import type { Interaction } from './types';

let nodes: HTMLElement[] = [];
let timers = new Set<number>();
let cleanup: (() => void)[] = [];

/** Foggy Town: a density slider, listen/search buttons and a lantern that reveals silhouettes. */
export const fogTown: Interaction = {
  init(ctx) {
    fogTown.destroy();
    const root = ctx.root;
    const layer = document.createElement('div');
    layer.className = 'town__creatures';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = FOG_CREATURES.map(
      (c) =>
        `<svg class="creature creature--${c.id}" data-creature="${c.id}" viewBox="0 0 ${c.id === 'lurker' ? 160 : c.id === 'tentacles' ? 120 : c.id === 'crawlers' ? 80 : c.id === 'moths' ? 100 : 66} 130" style="left:${c.x}%;top:${c.y}%;width:${c.w}vmin">${c.svg}</svg>`,
    ).join('');
    const controls = document.createElement('div');
    controls.className = 'town__controls';
    controls.innerHTML = `
      <label class="town__density">Fog density
        <input type="range" min="0" max="100" step="5" value="60" />
      </label>
      <button type="button" class="town__btn" data-act="listen">Listen</button>
      <button type="button" class="town__btn" data-act="search">Search with the lantern</button>
      <button type="button" class="town__btn" data-act="siren" aria-pressed="false">Sound the siren</button>
      <p class="town__status" aria-live="polite">The street is quiet. Too quiet.</p>`;
    root.append(layer, controls);
    nodes = [layer, controls];

    const stage = root;
    const range = controls.querySelector('input') as HTMLInputElement;
    const status = controls.querySelector('.town__status') as HTMLElement;
    const setDensity = () =>
      stage.style.setProperty('--fog', String(clampFogDensity(range.value) / 100));
    setDensity();
    range.addEventListener('input', setDensity);

    const reveal = (id: string, text?: string) => {
      const el = layer.querySelector(`[data-creature="${id}"]`);
      if (!el) return;
      el.classList.add('creature--shown');
      const t = window.setTimeout(() => {
        timers.delete(t);
        el.classList.remove('creature--shown');
      }, revealDurationMs(ctx.settings.get()));
      timers.add(t);
      if (text) {
        status.textContent = text;
        ctx.announce(text);
      }
    };
    const counters: Record<RevealKind, number> = { listen: 0, search: 0 };
    controls.querySelectorAll<HTMLButtonElement>('.town__btn').forEach((b) => {
      b.addEventListener('click', () => {
        const act = b.dataset.act;
        if (act === 'siren') {
          const on = b.getAttribute('aria-pressed') !== 'true';
          b.setAttribute('aria-pressed', String(on));
          stage.classList.toggle('town--siren', on);
          const text = on
            ? 'The rusty siren groans to life. Everything in the fog turns to look.'
            : 'The siren winds down into silence.';
          status.textContent = text;
          ctx.announce(text);
          if (on && sirenSoundAllowed(ctx.settings.get())) ctx.audio.play('creak');
          return;
        }
        const kind = act as RevealKind;
        const c = nextCreature(kind, counters[kind]++);
        reveal(c.id, c.caption);
        ctx.addScore(5);
      });
    });

    // Lantern: pointer movement lights a circle and reveals nearby silhouettes briefly.
    let last = 0;
    const onMove = (e: PointerEvent) => {
      stage.style.setProperty('--mx', `${e.clientX}px`);
      stage.style.setProperty('--my', `${e.clientY}px`);
      const now = performance.now();
      if (now - last < 400) return;
      last = now;
      const px = (e.clientX / window.innerWidth) * 100;
      const py = (e.clientY / window.innerHeight) * 100;
      for (const c of FOG_CREATURES) if (pointerNear(c, px, py)) reveal(c.id);
    };
    window.addEventListener('pointermove', onMove);
    cleanup.push(() => window.removeEventListener('pointermove', onMove));
  },
  destroy() {
    for (const t of timers) clearTimeout(t);
    timers = new Set();
    for (const c of cleanup) c();
    cleanup = [];
    for (const n of nodes) n.remove();
    nodes = [];
  },
};
