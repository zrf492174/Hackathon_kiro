export interface Settings {
  muted: boolean;
  reducedMotion: boolean;
  scaresEnabled: boolean;
  safeMode: boolean;
  /** Opt-in dark flashlight overlay. */
  flashlight: boolean;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const SETTINGS_KEY = 'haunted-hollow:settings';

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  muted: false,
  reducedMotion: false,
  scaresEnabled: false,
  safeMode: false,
  flashlight: false,
});

export function parseSettings(raw: string | null): Settings {
  const result: Settings = { ...DEFAULT_SETTINGS };
  if (!raw) return result;
  try {
    const data: unknown = JSON.parse(raw);
    if (data && typeof data === 'object') {
      const rec = data as Record<string, unknown>;
      for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
        if (typeof rec[key] === 'boolean') result[key] = rec[key] as boolean;
      }
    }
  } catch {
    // corrupt data: fall back to defaults
  }
  return result;
}

/** Scares only fire when explicitly enabled and safe mode is off. */
export function scaresActive(s: Settings): boolean {
  return s.scaresEnabled && !s.safeMode;
}

/** Flashing effects are disabled by safe mode or reduced motion. */
export function flashingAllowed(s: Settings): boolean {
  return !s.safeMode && !s.reducedMotion;
}

export type Listener = (settings: Settings) => void;

export class SettingsStore {
  private current: Settings;
  private listeners = new Set<Listener>();

  constructor(private storage: StorageLike | null) {
    let raw: string | null = null;
    try {
      raw = storage ? storage.getItem(SETTINGS_KEY) : null;
    } catch {
      raw = null;
    }
    this.current = parseSettings(raw);
  }

  get(): Settings {
    return { ...this.current };
  }

  set(patch: Partial<Settings>): void {
    const next: Settings = { ...this.current, ...patch };
    // Safe mode always turns scares off.
    if (next.safeMode) next.scaresEnabled = false;
    this.current = next;
    try {
      this.storage?.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable (private mode): keep in memory only
    }
    for (const l of this.listeners) l(this.get());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export function createBrowserSettings(): SettingsStore {
  let storage: StorageLike | null = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  return new SettingsStore(storage);
}
