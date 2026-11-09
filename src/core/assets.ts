/** Loads public/assets/manifest.json, picks approved assets by category, falls back to placeholders. */

export interface AssetRecord {
  id: string;
  type: 'image' | 'audio';
  category: string;
  file: string;
  title: string;
  author: string;
  license: string;
  status: 'approved' | 'pending' | 'rejected';
  licenseUrl?: string;
  source?: { pageUrl?: string };
}

export interface AssetManifest {
  version: number;
  assets: AssetRecord[];
}

export const PLACEHOLDERS: Record<string, string[]> = {
  ghosts: ['placeholders/ghost.svg'],
  pumpkins: ['placeholders/pumpkin-on.svg', 'placeholders/pumpkin-off.svg'],
  bats: ['placeholders/bat.svg'],
  webs: ['placeholders/cobweb.svg', 'placeholders/spider.svg'],
  scenery: ['placeholders/tombstone.svg', 'placeholders/eyes.svg', 'placeholders/moon.svg'],
};

export class AssetLibrary {
  constructor(
    private manifest: AssetManifest | null,
    private base = '/',
  ) {}

  /** Approved image records for a category (never pending or rejected). */
  approved(category: string): AssetRecord[] {
    return (this.manifest?.assets ?? []).filter(
      (a) => a.status === 'approved' && a.type === 'image' && a.category === category,
    );
  }

  /** URLs for a category, real approved assets first-class, placeholders when none exist. */
  urls(category: string): string[] {
    const real = this.approved(category).filter((a) => !a.id.startsWith('placeholder-'));
    const files = real.length > 0 ? real.map((a) => a.file) : (PLACEHOLDERS[category] ?? []);
    return files.map((f) => this.base + 'assets/' + f);
  }

  /** All approved image records (used by the collection book). */
  records(): AssetRecord[] {
    return (this.manifest?.assets ?? []).filter((a) => a.status === 'approved');
  }

  /** Find the record that a loaded URL belongs to. */
  recordForUrl(url: string): AssetRecord | null {
    const hit = this.records().find((a) => url.endsWith('assets/' + a.file));
    return hit ?? null;
  }

  /** Pick one URL at random (rng injectable). Returns null for an unknown category. */
  pick(category: string, rng: () => number = Math.random): string | null {
    const urls = this.urls(category);
    if (urls.length === 0) return null;
    return urls[Math.floor(rng() * urls.length) % urls.length];
  }
}

/** Fetch the manifest; any failure (missing, 404, bad JSON, offline) yields a placeholder-only library. */
export async function loadAssets(
  base = '/',
  fetchImpl: typeof fetch = fetch,
): Promise<AssetLibrary> {
  try {
    const res = await fetchImpl(`${base}assets/manifest.json`);
    if (!res.ok) return new AssetLibrary(null, base);
    const json = (await res.json()) as AssetManifest;
    if (!json || !Array.isArray(json.assets)) return new AssetLibrary(null, base);
    return new AssetLibrary(json, base);
  } catch {
    return new AssetLibrary(null, base);
  }
}
