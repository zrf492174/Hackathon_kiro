import { arcIntensity, figureMotionAllowed } from './gating';
import { FLASKS } from '../scenes/labArt';
import type { Interaction } from './types';

let box: HTMLElement | null = null;

/** Voltage slider and bubbling flasks. The arc reads --arc from the stage (0 when the lever is off). */
export const labControls: Interaction = {
  init(ctx) {
    labControls.destroy();
    const el = document.createElement('div');
    el.className = 'lab__controls';
    el.innerHTML = `
      <label class="lab__volt">Voltage
        <input type="range" min="0" max="100" value="60" step="5" aria-describedby="lab-volt-out" />
        <output id="lab-volt-out">60 kV</output>
      </label>
      <div class="lab__flasks" role="group" aria-label="Flasks">
        ${FLASKS.map(
          (f) =>
            `<button type="button" class="flask" data-flask="${f.id}" aria-pressed="false" aria-label="${f.label}" style="--flask:${f.color}"><svg viewBox="0 0 30 40" aria-hidden="true" focusable="false"><path d="M11 2h8v12l9 20q1 4-3 4H5q-4 0-3-4l9-20z" fill="#1a1626" stroke="#8a8aa0" stroke-width="1.5"/><path class="flask__liquid" d="M7 28h16l4 8q1 2-2 2H5q-3 0-2-2z" fill="${f.color}"/><circle class="flask__b flask__b1" cx="13" cy="24" r="2" fill="${f.color}"/><circle class="flask__b flask__b2" cx="18" cy="20" r="1.5" fill="${f.color}"/></svg></button>`,
        ).join('')}
      </div>`;
    const input = el.querySelector('input') as HTMLInputElement;
    const out = el.querySelector('output') as HTMLOutputElement;
    const apply = () => {
      const live = ctx.root.classList.contains('lab--live');
      ctx.root.style.setProperty('--arc', String(arcIntensity(input.value, live)));
      out.textContent = `${input.value} kV`;
    };
    input.addEventListener('input', () => {
      apply();
      const live = ctx.root.classList.contains('lab--live');
      ctx.announce(
        live
          ? `Voltage ${input.value} kilovolts.`
          : `Voltage set to ${input.value}. Pull the lever to feel it.`,
      );
    });
    new MutationObserver(apply).observe(ctx.root, { attributes: true, attributeFilter: ['class'] });
    el.querySelectorAll<HTMLButtonElement>('.flask').forEach((b, i) => {
      b.addEventListener('click', () => {
        const on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(on));
        b.classList.toggle(
          'flask--bubbling',
          on && figureMotionAllowed(ctx.settings.get(), ctx.osReducedMotion()),
        );
        ctx.announce(on ? FLASKS[i].note : `The ${FLASKS[i].label.toLowerCase()} settles.`);
      });
    });
    ctx.root.appendChild(el);
    ctx.root.style.setProperty('--arc', '0');
    box = el;
  },
  destroy() {
    box?.remove();
    box = null;
  },
};
