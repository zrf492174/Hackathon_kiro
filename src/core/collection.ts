import type { StorageLike } from './settings';

export const COLLECTION_KEY = 'haunted-hollow:collection';

/** Parse stored JSON into a clean list of unique string ids. */
export function parseCollection(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return [...new Set(data.filter((x): x is string => typeof x === 'string'))];
  } catch {
    return [];
  }
}

/** localStorage-backed set of discovered asset ids. */
export class CollectionStore {
  private ids: Set<string>;
  private listeners = new Set<() => void>();

  constructor(private storage: StorageLike | null) {
    let raw: string | null = null;
    try {
      raw = storage ? storage.getItem(COLLECTION_KEY) : null;
    } catch {
      raw = null;
    }
    this.ids = new Set(parseCollection(raw));
  }

  has(id: string): boolean {
    return this.ids.has(id);
  }

  list(): string[] {
    return [...this.ids];
  }

  /** Returns true when the id was newly discovered. */
  add(id: string): boolean {
    if (this.ids.has(id)) return false;
    this.ids.add(id);
    try {
      this.storage?.setItem(COLLECTION_KEY, JSON.stringify(this.list()));
    } catch {
      // storage unavailable: keep in memory only
    }
    for (const l of this.listeners) l();
    return true;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export function createBrowserCollection(): CollectionStore {
  let storage: StorageLike | null = null;
  try {
    storage = window.localStorage;
  } catch {
    storage = null;
  }
  return new CollectionStore(storage);
}
