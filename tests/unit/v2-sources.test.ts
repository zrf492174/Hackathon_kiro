import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parsePixabay, searchPixabay } from '../../scripts/collect/sources/pixabay';
import { parseUnsplash, searchUnsplash } from '../../scripts/collect/sources/unsplash';
import { parseFreesound, searchFreesound } from '../../scripts/collect/sources/freesound';
import { RateLimitError } from '../../scripts/collect/sources/types';
import { optimizeImage } from '../../scripts/collect/optimize';

const fx = (n: string) => JSON.parse(readFileSync(`tests/fixtures/${n}.json`, 'utf8'));
const mockFetch = (body: unknown, status = 200) =>
  (async () => new Response(JSON.stringify(body), { status })) as typeof fetch;

afterEach(() => vi.unstubAllEnvs());

const cases = [
  ['pixabay', parsePixabay, searchPixabay, 'PIXABAY_KEY', 'PIXABAY'],
  ['unsplash', parseUnsplash, searchUnsplash, 'UNSPLASH_KEY', 'UNSPLASH'],
  ['freesound', parseFreesound, searchFreesound, 'FREESOUND_KEY', undefined],
] as const;

describe.each(cases)('%s adapter', (name, parse, search, envKey, license) => {
  it('parses ok fixture', () => {
    const c = parse(fx(`${name}-ok`));
    expect(c.length).toBeGreaterThan(0);
    expect(c.every((x) => x.provider === name && x.downloadUrl && x.pageUrl)).toBe(true);
    if (license) expect(c[0].license).toBe(license);
  });
  it('handles empty', async () => {
    vi.stubEnv(envKey, 'k');
    const r = await search({ query: 'x', limit: 5, fetchImpl: mockFetch(fx(`${name}-empty`)) });
    expect(r).toEqual([]);
  });
  it('throws RateLimitError on 429', async () => {
    vi.stubEnv(envKey, 'k');
    await expect(
      search({ query: 'x', limit: 5, fetchImpl: mockFetch(fx(`${name}-429`), 429) }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });
  it('drops entries with missing license or urls', () => {
    expect(parse(fx(`${name}-missing-license`))).toEqual([]);
  });
  it('skips with a warning when the key is absent', async () => {
    vi.stubEnv(envKey, '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await search({ query: 'x', limit: 5, fetchImpl: mockFetch(fx(`${name}-ok`)) });
    expect(r).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('freesound licenses', () => {
  it('keeps CC0 and CC-BY, drops NC', () => {
    const c = parseFreesound(fx('freesound-ok'));
    expect(c.map((x) => x.license)).toEqual(['CC0-1.0', 'CC-BY-4.0']);
    expect(c[1].attributionRequired).toBe(true);
  });
});

describe('optimizeImage', () => {
  it('produces webp full and thumb within limits', async () => {
    const sharp = (await import('sharp')).default;
    const png = await sharp({
      create: { width: 2400, height: 1200, channels: 3, background: '#223' },
    })
      .png()
      .toBuffer();
    const r = await optimizeImage(new Uint8Array(png));
    expect(r).not.toBeNull();
    expect(r?.width).toBe(1600);
    expect(r?.height).toBe(800);
    const meta = await sharp(Buffer.from(r?.thumb ?? [])).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(320);
  });
});
