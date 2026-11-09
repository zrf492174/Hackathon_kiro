import { bats, eyes, lightning, popupGhost } from '../interactions';
import { createFigures } from '../interactions/figures';
import { graveyardStones } from '../interactions/graveyardStones';
import { createScene } from './scene';
import { GRAVEYARD_SVG } from './graveyardArt';

/** The graveyard: layered backdrop, readable tombstones, crows, a gravedigger, storm and ghosts. */
export const graveyard = createScene(
  'scene-graveyard',
  'The graveyard',
  [lightning, eyes, bats, popupGhost, graveyardStones, createFigures('graveyard')],
  `<p class="scene-title">The Graveyard</p><div class="yard">${GRAVEYARD_SVG}</div>`,
);
