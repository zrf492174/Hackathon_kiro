import type { Interaction, InteractionContext } from '../interactions';

export interface SceneHandle {
  enter(ctx: InteractionContext): void;
  leave(): void;
}

/** Builds a scene from a label and a list of interactions; leave() destroys all of them. */
export function createScene(
  className: string,
  label: string,
  interactions: Interaction[],
  extraHtml = '',
): SceneHandle {
  let stage: HTMLElement | null = null;
  const handle: SceneHandle = {
    enter(ctx) {
      handle.leave();
      stage = document.createElement('section');
      stage.className = `gate-stage ${className}`;
      stage.setAttribute('aria-label', label);
      stage.innerHTML = extraHtml;
      ctx.root.appendChild(stage);
      const scoped: InteractionContext = { ...ctx, root: stage };
      for (const i of interactions) i.init(scoped);
    },
    leave() {
      for (const i of [...interactions].reverse()) i.destroy();
      stage?.remove();
      stage = null;
    },
  };
  return handle;
}
