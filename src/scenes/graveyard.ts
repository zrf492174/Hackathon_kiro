import { graveyardStones } from '../interactions/graveyardStones';
import { createScene } from './scene';
import { GRAVEYARD_SVG } from './graveyardArt';

/** The graveyard: a foggy village churchyard lit by one gas lamp. Nobody is here. */
export const graveyard = createScene(
  'scene-graveyard',
  'The graveyard',
  [graveyardStones],
  `<p class="scene-title">The Graveyard</p><div class="yard">${GRAVEYARD_SVG}</div>`,
);
