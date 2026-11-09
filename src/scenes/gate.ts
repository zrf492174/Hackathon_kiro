import { bats, cobweb, flashlight, popupGhost } from '../interactions';
import { createFigures } from '../interactions/figures';
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
    <p class="gate__hint">The gate stands open. Choose a path below.</p>`;
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
}

export function leaveGate(): void {
  for (const i of [...INTERACTIONS].reverse()) i.destroy();
  stage?.remove();
  stage = null;
}
