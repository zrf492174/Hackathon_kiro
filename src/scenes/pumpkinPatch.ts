import { eyes, popupGhost, pumpkin } from '../interactions';
import { createScene } from './scene';

/** The pumpkin patch: the lantern puzzle again, with eyes and ghosts. */
export const pumpkinPatch = createScene(
  'scene-patch',
  'The pumpkin patch',
  [pumpkin, eyes, popupGhost],
  '<p class="scene-title">The Pumpkin Patch</p><p class="scene-hint">Five lanterns, one right order. A wrong light puts them all out.</p><div class="hidden-door" hidden role="img" aria-label="A hidden door, now open"></div>',
);
