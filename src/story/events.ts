/** Window event fired by interactions when a story objective is met. detail is the objective id. */
export const OBJECTIVE_EVENT = 'hollow:objective';

export type ObjectiveId =
  'gate-open' | 'pumpkins-lit' | 'candles-out' | 'creature-awake' | 'page-turned';

/** Tell the story layer that an objective was reached. Safe to call repeatedly. */
export function signal(id: ObjectiveId): void {
  window.dispatchEvent(new CustomEvent(OBJECTIVE_EVENT, { detail: id }));
}
