import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseOpenverse, searchOpenverse } from '../../scripts/collect/sources/openverse';
import { parseWikimedia, searchWikimedia } from '../../scripts/collect/sources/wikimedia';
import { RateLimitError } from '../../scripts/collect/sources/types';

const fx = (n: string) => JSON.parse(readFileSync(`tests/fixtures/${n}.json`, 'utf8'));
const mockFetch = (body: unknown, status = 200) =>
  (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;

describe('openverse adapter', () => {
  it('keeps only whitelisted, attributable results', () => {
    const c = parseOpenverse(fx('openverse-ok'));
    expect(c.map((x) => x.title)).toEqual(['Cute Ghost', 'Pumpkin Night']);
    expect(c[0].license).toBe('CC0-1.0');
    expect(c[0].attributionRequired).toBe(false);
    expect(c[1].license).toBe('CC-BY-4.0');
    expect(c[1].attributionRequired).toBe(true);
    expect(c[0].tags).toContain('ghost');
  });
  it('handles empty results', async () => {
    expect(
      await searchOpenverse({ query: 'x', limit: 5, fetchImpl: mockFetch(fx('openverse-empty')) }),
    ).toEqual([]);
  });
  it('throws RateLimitError on 429', async () => {
    await expect(
      searchOpenverse({ query: 'x', limit: 5, fetchImpl: mockFetch(fx('openverse-429'), 429) }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });
  it('drops missing licenses', () => {
    expect(parseOpenverse(fx('openverse-missing-license'))).toEqual([]);
  });
  it('respects limit', async () => {
    const r = await searchOpenverse({
      query: 'x',
      limit: 1,
      fetchImpl: mockFetch(fx('openverse-ok')),
    });
    expect(r).toHaveLength(1);
  });
});

describe('wikimedia adapter', () => {
  it('parses license, strips html author, rejects SA', () => {
    const c = parseWikimedia(fx('wikimedia-ok'));
    expect(c.map((x) => x.title)).toEqual(['Old graveyard', 'Full moon.png']);
    expect(c[0].author).toBe('Eve Photo');
    expect(c[0].license).toBe('CC-BY-4.0');
    expect(c[1].license).toBe('PDM');
  });
  it('handles empty results', async () => {
    expect(
      await searchWikimedia({ query: 'x', limit: 5, fetchImpl: mockFetch(fx('wikimedia-empty')) }),
    ).toEqual([]);
  });
  it('throws RateLimitError on 429', async () => {
    await expect(
      searchWikimedia({ query: 'x', limit: 5, fetchImpl: mockFetch(fx('wikimedia-429'), 429) }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });
  it('drops missing or unknown licenses', () => {
    expect(parseWikimedia(fx('wikimedia-missing-license'))).toEqual([]);
  });
});
