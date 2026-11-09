import type { AssetLibrary } from '../core/assets';
import type { AudioManager } from '../core/audio';
import type { SettingsStore } from '../core/settings';

export interface InteractionContext {
  root: HTMLElement;
  settings: SettingsStore;
  assets: AssetLibrary;
  audio: AudioManager;
  /** Whether the OS asks for reduced motion. */
  osReducedMotion: () => boolean;
  /** Announce text to the aria-live region. */
  announce: (message: string) => void;
  addScore: (points: number) => void;
}

export interface Interaction {
  init(ctx: InteractionContext): void;
  destroy(): void;
}
