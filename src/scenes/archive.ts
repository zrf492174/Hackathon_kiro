import { mountGazette, type Gazette } from '../ui/gazette';
import { mountGrimoire, type Grimoire } from '../ui/grimoire';
import { effectiveReducedMotion } from '../a11y/reducedMotion';
import type { Interaction } from '../interactions';
import { createScene } from './scene';

let handles: { destroy(): void }[] = [];
let gen = 0;
let cleanup: (() => void) | null = null;

const TABS = [
  { id: 'grimoires', label: 'Grimoires' },
  { id: 'gazette', label: 'Gazette' },
] as const;

/** One archive scene: a tablist swaps the grimoire and the gazette, with an epilogue underneath. */
const archiveTabs: Interaction = {
  init(ctx) {
    archiveTabs.destroy();
    const my = ++gen;
    const wrap = document.createElement('div');
    wrap.className = 'archive';
    wrap.innerHTML = `
      <p class="archive__ledger">Ledger, last page: "Visitors this year: one. Left the lamp lit for them."</p>
      <div class="archive__tabs" role="tablist" aria-label="Archive sections">
        ${TABS.map(
          (t, i) =>
            `<button type="button" role="tab" id="tab-${t.id}" aria-controls="panel-${t.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${t.label}</button>`,
        ).join('')}
      </div>
      ${TABS.map(
        (t, i) =>
          `<div role="tabpanel" id="panel-${t.id}" aria-labelledby="tab-${t.id}" class="archive__panel"${i === 0 ? '' : ' hidden'}></div>`,
      ).join('')}
      <div class="archive__epilogue">
        <h2>Epilogue</h2>
        <p>The keeper never came back. The fog, the lights and the sounds were old stories wearing new clothes, and every story here has a source. The collection book keeps a record of what you found.</p>
        <button type="button" class="archive__book">Open the collection book</button>
      </div>`;
    ctx.root.appendChild(wrap);
    const tabs = [...wrap.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = [...wrap.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    const select = (i: number, focus: boolean) => {
      tabs.forEach((t, k) => {
        t.setAttribute('aria-selected', String(k === i));
        t.tabIndex = k === i ? 0 : -1;
        panels[k].hidden = k !== i;
      });
      if (focus) tabs[i].focus();
      ctx.announce(`${TABS[i].label} open.`);
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i, false));
      t.addEventListener('keydown', (e) => {
        const k = e.key;
        if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'Home' && k !== 'End') return;
        e.preventDefault();
        const n = tabs.length;
        const to =
          k === 'Home' ? 0 : k === 'End' ? n - 1 : (i + (k === 'ArrowRight' ? 1 : -1) + n) % n;
        select(to, true);
      });
    });
    wrap.querySelector('.archive__book')?.addEventListener('click', () => {
      document.querySelector<HTMLButtonElement>('.book-btn')?.click();
    });
    const reduced = () => effectiveReducedMotion(ctx.settings.get(), ctx.osReducedMotion());
    void mountGrimoire(panels[0], reduced, ctx.announce).then((h: Grimoire) => {
      if (my === gen) handles.push(h);
      else h.destroy();
    });
    void mountGazette(panels[1]).then((h: Gazette) => {
      if (my === gen) handles.push(h);
      else h.destroy();
    });
    cleanup = () => wrap.remove();
  },
  destroy() {
    gen++;
    for (const h of handles) h.destroy();
    handles = [];
    cleanup?.();
    cleanup = null;
  },
};

export const archive = createScene('scene-archive', 'The archive', [archiveTabs]);
