import { bats, cobweb, flashlight, popupGhost, pumpkin } from '../interactions';
import type { Interaction, InteractionContext } from '../interactions';

const INTERACTIONS: Interaction[] = [cobweb, pumpkin, flashlight, popupGhost, bats];

let stage: HTMLElement | null = null;
let score = 0;

/** The gate scene: cobweb corner, pumpkin row, flashlight, wandering ghosts and bats. */
export function enterGate(ctx: InteractionContext): void {
  leaveGate();
  stage = document.createElement('section');
  stage.className = 'gate-stage';
  stage.setAttribute('aria-label', 'The haunted gate');
  stage.innerHTML = `
    <p class="score" aria-label="Score">Score: <span id="score">0</span></p>
    <div class="hidden-door" hidden role="img" aria-label="A hidden door, now open"></div>`;
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
