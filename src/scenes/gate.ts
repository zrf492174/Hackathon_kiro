import { bats, cobweb, flashlight, popupGhost } from '../interactions';
import { createFigures } from '../interactions/figures';
import { signal } from '../story/events';
import type { Interaction, InteractionContext } from '../interactions';

const INTERACTIONS: Interaction[] = [cobweb, flashlight, popupGhost, bats, createFigures('gate')];

let stage: HTMLElement | null = null;
let score = 0;

/** The gate scene: cobweb corner, flashlight, wandering ghosts and bats. */
export function enterGate(ctx: InteractionContext): void {
  leaveGate();
  stage = document.createElement('section');
  stage.className = 'gate-stage';
  stage.setAttribute('aria-label', 'The haunted gate');
  stage.innerHTML = `
    <p class="score">Score: <span id="score">0</span></p>
    <div class="gate" data-open="false">
      <svg class="gate__svg" viewBox="0 0 400 300" role="img" aria-label="A tall iron gate between two stone pillars, chained shut">
        <defs><filter id="gateStone" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="3" result="n"/><feDiffuseLighting in="n" lighting-color="#2c2738" surfaceScale="2" result="l"><feDistantLight azimuth="235" elevation="55"/></feDiffuseLighting><feComposite in="l" in2="SourceGraphic" operator="in"/></filter></defs>
        <rect x="0" y="262" width="400" height="38" fill="#0b0910"/>
        <g fill="#15111d" filter="url(#gateStone)"><rect x="20" y="70" width="46" height="200"/><rect x="334" y="70" width="46" height="200"/>
          <polygon points="14,70 43,40 72,70"/><polygon points="328,70 357,40 386,70"/></g>
        <path d="M66 72 V268 M380 72 V268 M43 41 L72 70 M357 41 L386 70" stroke="#a9b8e6" stroke-opacity="0.35" stroke-width="1.5" fill="none"/>
        <ellipse cx="200" cy="270" rx="190" ry="6" fill="#000" opacity="0.6"/>
        <g class="gate__leaf gate__leaf--l" fill="none" stroke="#2a2433" stroke-width="5">
          <path d="M70 268 V90 M95 268 V80 M120 268 V76 M145 268 V80 M170 268 V90 M70 120 H196 M70 230 H196 M70 90 Q133 50 196 90"/>
          <path d="M95 80 l0 -14 M120 76 l0 -16 M145 80 l0 -14" stroke-width="4"/></g>
        <g class="gate__leaf gate__leaf--r" fill="none" stroke="#2a2433" stroke-width="5">
          <path d="M330 268 V90 M305 268 V80 M280 268 V76 M255 268 V80 M230 268 V90 M330 120 H204 M330 230 H204 M330 90 Q267 50 204 90"/>
          <path d="M305 80 l0 -14 M280 76 l0 -16 M255 80 l0 -14" stroke-width="4"/></g>
        <g class="gate__chain" fill="none" stroke="#6a6676" stroke-width="3"><path d="M180 170 q20 14 40 0 M184 176 q16 10 32 0"/><rect x="192" y="176" width="16" height="14" fill="#3a3646"/></g>
        <path class="gate__moon" d="M330 24 a18 18 0 1 0 14 30 a14 14 0 1 1 -14 -30z" fill="#d8d4c0" opacity="0.8"/>
      </svg>
      <p class="gate__note">Nailed to the gate: "To whoever reads this. The lamp is lit. Come in, if you must, and mind the pumpkins. Do not trust the quiet. - the Keeper"</p>
      <button type="button" class="gate__latch" aria-pressed="false">Lift the latch</button>
    </div>`;
  ctx.root.appendChild(stage);
  score = 0;
  const scoped: InteractionContext = {
    ...ctx,
    root: stage,
    addScore: (n) => {
      score += n;
      const el = stage?.querySelector('#score');
      if (el) el.textContent = String(score);
      ctx.addScore(n);
    },
  };
  for (const i of INTERACTIONS) i.init(scoped);
  const latch = stage.querySelector<HTMLButtonElement>('.gate__latch');
  latch?.addEventListener('click', () => {
    const open = latch.getAttribute('aria-pressed') !== 'true';
    latch.setAttribute('aria-pressed', String(open));
    latch.textContent = open ? 'Close the gate' : 'Lift the latch';
    stage?.querySelector('.gate')?.setAttribute('data-open', String(open));
    ctx.announce(open ? 'The gate swings open.' : 'The gate creaks shut.');
    ctx.audio.play(open ? 'latch' : 'creak');
    if (open) signal('gate-open');
  });
}

export function leaveGate(): void {
  for (const i of [...INTERACTIONS].reverse()) i.destroy();
  stage?.remove();
  stage = null;
}
