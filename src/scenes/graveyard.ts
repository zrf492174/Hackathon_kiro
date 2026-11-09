import { bats, eyes, lightning, popupGhost } from '../interactions';
import { createScene } from './scene';

/** The graveyard: storm, rain, bats, eyes in the dark and ghosts. */
export const graveyard = createScene(
  'scene-graveyard',
  'The graveyard',
  [lightning, eyes, bats, popupGhost],
  '<p class="scene-title">The Graveyard</p>',
);
