import { candles, cobweb, eyes, flashlight, popupGhost } from '../interactions';
import { createFigures } from '../interactions/figures';
import { createScene } from './scene';

/** The attic: candles to blow out, cobwebs, watching eyes and ghosts. */
export const attic = createScene(
  'scene-attic',
  'The dusty attic',
  [cobweb, candles, flashlight, eyes, popupGhost, createFigures('attic')],
  `<p class="scene-title">The Attic</p>
   <p class="attic__letter">A letter on the trunk, in an old hand: "I built something and it frightened me. I hid in the dark so it would not see. If you blow out the candles, you will hear it. Go down to the castle and meet it kindly."</p>`,
);
