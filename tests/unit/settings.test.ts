import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  SettingsStore,
  flashingAllowed,
  parseSettings,
  scaresActive,
  type StorageLike,
} from '../../src/core/settings';

function memStorage(
  initial: Record<string, string> = {},
): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe('settings', () => {
  it('defaults: scares off, safe mode off', () => {
    const s = new SettingsStore(memStorage()).get();
    expect(s).toEqual(DEFAULT_SETTINGS);
    expect(s.scaresEnabled).toBe(false);
    expect(scaresActive(s)).toBe(false);
  });

  it('persists and reloads', () => {
    const st = memStorage();
    new SettingsStore(st).set({ muted: true, scaresEnabled: true });
    const again = new SettingsStore(st).get();
    expect(again.muted).toBe(true);
    expect(again.scaresEnabled).toBe(true);
  });

  it('ignores corrupt or wrongly typed data', () => {
    expect(parseSettings('{oops')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(JSON.stringify({ scaresEnabled: 'yes', muted: true }))).toEqual({
      ...DEFAULT_SETTINGS,
      muted: true,
    });
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it('safe mode turns scares off and blocks flashing', () => {
    const store = new SettingsStore(memStorage());
    store.set({ scaresEnabled: true });
    expect(scaresActive(store.get())).toBe(true);
    store.set({ safeMode: true });
    const s = store.get();
    expect(s.scaresEnabled).toBe(false);
    expect(scaresActive(s)).toBe(false);
    expect(flashingAllowed(s)).toBe(false);
  });

  it('reduced motion blocks flashing', () => {
    expect(flashingAllowed({ ...DEFAULT_SETTINGS, reducedMotion: true })).toBe(false);
    expect(flashingAllowed(DEFAULT_SETTINGS)).toBe(true);
  });

  it('notifies subscribers and supports unsubscribe', () => {
    const store = new SettingsStore(memStorage());
    const seen: boolean[] = [];
    const off = store.subscribe((s) => seen.push(s.muted));
    store.set({ muted: true });
    off();
    store.set({ muted: false });
    expect(seen).toEqual([true]);
  });

  it('survives throwing storage', () => {
    const bad: StorageLike = {
      getItem: () => {
        throw new Error('no');
      },
      setItem: () => {
        throw new Error('no');
      },
    };
    const store = new SettingsStore(bad);
    expect(() => store.set({ muted: true })).not.toThrow();
    expect(store.get().muted).toBe(true);
  });

  it('uses the documented storage key', () => {
    const st = memStorage();
    new SettingsStore(st).set({ muted: true });
    expect(st.data[SETTINGS_KEY]).toBeDefined();
  });
});
