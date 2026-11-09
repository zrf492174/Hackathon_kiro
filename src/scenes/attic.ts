import { candles, cobweb, eyes, flashlight, popupGhost } from '../interactions';
import { createFigures } from '../interactions/figures';
import { createScene } from './scene';

/** The attic: candles to blow out, cobwebs, watching eyes and ghosts. */
export const attic = createScene(
  'scene-attic',
  'The dusty attic',
  [cobweb, candles, flashlight, eyes, popupGhost, createFigures('attic')],
  '<p class="scene-title">The Attic</p>',
);
