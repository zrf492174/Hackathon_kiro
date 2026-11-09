import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseArxiv, searchArxiv } from '../../scripts/collect/lit/arxiv';
import { parseCrossref, searchCrossref } from '../../scripts/collect/lit/crossref';
import { parseEuropePmc, searchEuropePmc } from '../../scripts/collect/lit/europepmc';
import { parseGdelt, searchGdelt } from '../../scripts/collect/lit/gdelt';
import { parseOpenAlex, searchOpenAlex } from '../../scripts/collect/lit/openalex';
import { RateLimitError, snippetFor } from '../../scripts/collect/lit/types';
import { parseWikinews, searchWikinews } from '../../scripts/collect/lit/wikinews';

const raw = (n: string) => readFileSync(`tests/fixtures/${n}`, 'utf8');
const js = (n: string) => JSON.parse(raw(n));
const mock = (body: string, status = 200) =>
  (async () => new Response(body, { status })) as typeof fetch;

describe('openalex', () => {
  it('parses works and rebuilds the abstract', () => {
    const r = parseOpenAlex(js('lit-openalex-ok.json'));
    expect(r).toHaveLength(2);
    expect(r[0].doi).toBe('10.1234/bat.1');
    expect(r[0].url).toBe('https://doi.org/10.1234/bat.1');
    expect(r[0].abstractSnippet).toBe('Bats fly at night');
    expect(r[0].authors).toEqual(['A. Batson']);
  });
  it('caps snippets at 300 chars', () => {
    const r = parseOpenAlex(js('lit-openalex-ok.json'));
    expect(r[1].abstractSnippet!.length).toBeLessThanOrEqual(300);
  });
  it('drops records missing title or link', () => {
    expect(parseOpenAlex(js('lit-openalex-missing.json'))).toEqual([]);
  });
  it('handles empty, limit and 429', async () => {
    const f = (n: string, s = 200) => mock(raw(n), s);
    expect(
      await searchOpenAlex({ query: 'x', limit: 5, fetchImpl: f('lit-openalex-empty.json') }),
    ).toEqual([]);
    const one = await searchOpenAlex({
      query: 'x',
      limit: 1,
      fetchImpl: f('lit-openalex-ok.json'),
    });
    expect(one).toHaveLength(1);
    await expect(
      searchOpenAlex({ query: 'x', limit: 5, fetchImpl: f('lit-openalex-429.json', 429) }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });
});

describe('crossref', () => {
  it('parses items and never keeps abstracts', () => {
    const r = parseCrossref(js('lit-crossref-ok.json'));
    expect(r.map((x) => x.doi)).toEqual(['10.1234/spider.2', '10.1234/bat.1']);
    expect(r[0].year).toBe(2019);
    expect(r[0].authors).toEqual(['Ann Webb']);
    expect(r[0].abstractSnippet).toBeUndefined();
  });
  it('drops missing fields, empty, 429', async () => {
    expect(parseCrossref(js('lit-crossref-missing.json'))).toEqual([]);
    expect(
      await searchCrossref({
        query: 'x',
        limit: 3,
        fetchImpl: mock(raw('lit-crossref-empty.json')),
      }),
    ).toEqual([]);
    await expect(
      searchCrossref({ query: 'x', limit: 3, fetchImpl: mock('{}', 429) }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });
});

describe('europepmc', () => {
  it('gates abstract snippets on open access', () => {
    const r = parseEuropePmc(js('lit-europepmc-ok.json'));
    expect(r).toHaveLength(2);
    expect(r[0].abstractSnippet).toBe('Background Foxfire glows in the dark.');
    expect(r[0].license).toBe('CC-BY-4.0');
    expect(r[1].abstractSnippet).toBeUndefined();
    expect(r[1].url).toBe('https://europepmc.org/article/MED/222');
  });
  it('drops missing fields, empty, 429', async () => {
    expect(parseEuropePmc(js('lit-europepmc-missing.json'))).toEqual([]);
    expect(
      await searchEuropePmc({
        query: 'x',
        limit: 3,
        fetchImpl: mock(raw('lit-europepmc-empty.json')),
      }),
    ).toEqual([]);
    await expect(
      searchEuropePmc({ query: 'x', limit: 3, fetchImpl: mock('{}', 429) }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });
});

describe('arxiv', () => {
  it('parses Atom, decodes entities and uses https', () => {
    const r = parseArxiv(raw('lit-arxiv-ok.xml'));
    expect(r).toHaveLength(2);
    expect(r[0].title).toBe('Pumpkin & Gourd Growth');
    expect(r[0].authors).toEqual(['Gord Orange', 'Pat Kin']);
    expect(r[0].url).toBe('https://arxiv.org/abs/2001.00001v1');
    expect(r[0].year).toBe(2020);
    expect(r[0].abstractSnippet).toBeUndefined();
    expect(r[1].doi).toBe('10.1234/ghost.4');
  });
  it('drops missing fields, empty, limit, 429', async () => {
    expect(parseArxiv(raw('lit-arxiv-missing.xml'))).toEqual([]);
    expect(parseArxiv(raw('lit-arxiv-empty.xml'))).toEqual([]);
    expect(
      await searchArxiv({ query: 'x', limit: 1, fetchImpl: mock(raw('lit-arxiv-ok.xml')) }),
    ).toHaveLength(1);
    await expect(
      searchArxiv({ query: 'x', limit: 3, fetchImpl: mock('', 429) }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });
});

describe('news adapters', () => {
  it('gdelt keeps link, title, domain, year only', () => {
    const r = parseGdelt(js('lit-gdelt-ok.json'));
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ kind: 'news', venue: 'news.example.com', year: 2024 });
    expect(r[0].abstractSnippet).toBeUndefined();
    expect(parseGdelt(js('lit-gdelt-missing.json'))).toEqual([]);
    expect(parseGdelt(js('lit-gdelt-empty.json'))).toEqual([]);
  });
  it('wikinews builds urls and records terms', () => {
    const r = parseWikinews(js('lit-wikinews-ok.json'));
    expect(r[0].url).toBe('https://en.wikinews.org/wiki/Halloween_celebrated_worldwide');
    expect(r[0].license).toContain('CC BY 2.5');
    expect(parseWikinews(js('lit-wikinews-missing.json'))).toEqual([]);
    expect(parseWikinews(js('lit-wikinews-empty.json'))).toEqual([]);
  });
  it('throws RateLimitError on 429', async () => {
    await expect(
      searchGdelt({ query: 'x', limit: 3, fetchImpl: mock('{}', 429) }),
    ).rejects.toBeInstanceOf(RateLimitError);
    await expect(
      searchWikinews({ query: 'x', limit: 3, fetchImpl: mock('{}', 429) }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });
});

describe('snippetFor', () => {
  it('only allows permissive licences and strips tags', () => {
    expect(snippetFor('CC0-1.0', '<p>Hi  there</p>')).toBe('Hi there');
    expect(snippetFor('All rights reserved', 'Hi')).toBeUndefined();
    expect(snippetFor('CC0-1.0', '')).toBeUndefined();
    expect(snippetFor('CC0-1.0', 'a'.repeat(500))!.length).toBe(300);
  });
});
