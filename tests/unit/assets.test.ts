import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AssetLibrary, PLACEHOLDERS, loadAssets, type AssetManifest } from '../../src/core/assets';

const rec = (id: string, status: 'approved' | 'pending' | 'rejected', file: string) => ({
  id,
  type: 'image' as const,
  category: 'ghosts',
  file,
  title: id,
  author: 'a',
  license: 'CC0-1.0',
  status,
});

describe('AssetLibrary', () => {
  it('uses approved real assets and ignores pending and rejected', () => {
    const m: AssetManifest = {
      version: 1,
      assets: [
        rec('img-1', 'approved', 'images/ghosts/a.webp'),
        rec('img-2', 'pending', 'images/ghosts/b.webp'),
        rec('img-3', 'rejected', 'images/ghosts/c.webp'),
      ],
    };
    expect(new AssetLibrary(m, '/b/').urls('ghosts')).toEqual(['/b/assets/images/ghosts/a.webp']);
  });
  it('falls back to placeholders without manifest or approved assets', () => {
    expect(new AssetLibrary(null, '/').urls('ghosts')).toEqual(['/assets/placeholders/ghost.svg']);
    const m: AssetManifest = { version: 1, assets: [rec('img-2', 'pending', 'x.webp')] };
    expect(new AssetLibrary(m).urls('ghosts')).toEqual(['/assets/placeholders/ghost.svg']);
  });
  it('pick uses rng and returns null for unknown category', () => {
    const lib = new AssetLibrary(null);
    expect(lib.pick('pumpkins', () => 0.99)).toContain('pumpkin-off');
    expect(lib.pick('nope')).toBeNull();
  });
});

describe('loadAssets', () => {
  it('falls back on 404 and on network error', async () => {
    const f404 = (async () => new Response('', { status: 404 })) as typeof fetch;
    const fErr = (async () => {
      throw new Error('offline');
    }) as typeof fetch;
    expect((await loadAssets('/', f404)).urls('bats')).toEqual(['/assets/placeholders/bat.svg']);
    expect((await loadAssets('/', fErr)).urls('bats')).toEqual(['/assets/placeholders/bat.svg']);
  });
  it('loads the real committed manifest with all placeholders approved', async () => {
    const text = readFileSync('public/assets/manifest.json', 'utf8');
    const lib = await loadAssets('/', (async () => new Response(text)) as typeof fetch);
    for (const cat of Object.keys(PLACEHOLDERS)) expect(lib.urls(cat).length).toBeGreaterThan(0);
    expect(lib.approved('pumpkins').length).toBe(2);
  });
});
