import { mountGazette, type Gazette } from '../ui/gazette';
import { mountGrimoire, type Grimoire } from '../ui/grimoire';
import { effectiveReducedMotion } from '../a11y/reducedMotion';
import type { Interaction } from './types';

let g: Grimoire | null = null;
let n: Gazette | null = null;
let genG = 0;
let genN = 0;

export const grimoirePanel: Interaction = {
  init(ctx) {
    grimoirePanel.destroy();
    const my = ++genG;
    void mountGrimoire(
      ctx.root,
      () => effectiveReducedMotion(ctx.settings.get(), ctx.osReducedMotion()),
      ctx.announce,
    ).then((h) => {
      if (my === genG && g === null) g = h;
      else h.destroy();
    });
  },
  destroy() {
    genG++;
    g?.destroy();
    g = null;
  },
};

export const gazettePanel: Interaction = {
  init(ctx) {
    gazettePanel.destroy();
    const my = ++genN;
    void mountGazette(ctx.root).then((h) => {
      if (my === genN && n === null) n = h;
      else h.destroy();
    });
  },
  destroy() {
    genN++;
    n?.destroy();
    n = null;
  },
};
