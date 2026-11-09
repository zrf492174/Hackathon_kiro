import { cpSync, mkdtempSync, readFileSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { collectLit, parseLitArgs, verifyLit } from '../../scripts/collect/lit/index';
import { dedupeRecords, validateDataset, validateRecord } from '../../scripts/collect/lit/schema';

const dirs: string[] = [];
function sandbox(): string {
  const d = mkdtempSync(join(tmpdir(), 'lit-'));
  dirs.push(d);
  mkdirSync(join(d, 'scripts/collect'), { recursive: true });
  cpSync('scripts/collect/lit', join(d, 'scripts/collect/lit'), { recursive: true });
  cpSync('tests/fixtures', join(d, 'tests/fixtures'), { recursive: true });
  cpSync('public/data', join(d, 'public/data'), { recursive: true });
  return d;
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});
const quiet = { log: () => {}, sleep: async () => {} };

describe('seed datasets', () => {
  it('pass verify and meet the minimum counts', () => {
    expect(verifyLit('.')).toEqual([]);
    const papers = JSON.parse(readFileSync('public/data/grimoire.json', 'utf8'));
    const news = JSON.parse(readFileSync('public/data/gazette.json', 'utf8'));
    expect(papers.records.length).toBeGreaterThanOrEqual(12);
    expect(news.records.length).toBeGreaterThanOrEqual(6);
    expect(papers.meta.terms).toBeTruthy();
  });
});

describe('schema', () => {
  const ok = {
    kind: 'paper' as const,
    id: 'a',
    title: 't',
    authors: [],
    url: 'https://x.org',
    source: 's',
    license: 'l',
    topic: 't',
    fetchedAt: 'now',
  };
  it('accepts a valid record', () => expect(validateRecord(ok, 'r')).toEqual([]));
  it('flags problems', () => {
    expect(validateRecord({ ...ok, url: 'http://x' }, 'r')).toHaveLength(1);
    expect(validateRecord({ ...ok, abstractSnippet: 'a'.repeat(301) }, 'r')).toHaveLength(1);
    expect(validateRecord({ ...ok, doi: 'nope' }, 'r')).toHaveLength(1);
    expect(validateRecord({ ...ok, sample: true }, 'r')).toHaveLength(1);
    expect(validateRecord({ ...ok, title: '' }, 'r')).toHaveLength(1);
  });
  it('flags duplicates and missing meta', () => {
    const d = {
      meta: { generatedAt: 'x', kind: 'paper' as const, sources: [], terms: 't' },
      records: [ok, { ...ok, id: 'b' }],
    };
    expect(validateDataset(d, 'paper').some((p) => p.includes('duplicate'))).toBe(true);
    expect(validateDataset({ records: [] }, 'paper')).toHaveLength(1);
  });
  it('dedupes by DOI then URL', () => {
    const r = dedupeRecords([
      { doi: '10.1/a', url: 'u1' },
      { doi: '10.1/a', url: 'u2' },
      { url: 'u3' },
      { url: 'u3' },
    ]);
    expect(r).toHaveLength(2);
  });
});

describe('collectLit', () => {
  it('parses flags', () => {
    expect(parseLitArgs(['--all', '--offline', '--dry-run'])).toEqual({
      all: true,
      offline: true,
      dryRun: true,
    });
  });
  it('offline mode never touches the network and writes nothing', async () => {
    const root = sandbox();
    const before = readFileSync(join(root, 'public/data/grimoire.json'), 'utf8');
    const fetchImpl = (() => {
      throw new Error('network used');
    }) as unknown as typeof fetch;
    const r = await collectLit({ all: true, offline: true, dryRun: false }, root, {
      ...quiet,
      fetchImpl,
    });
    expect(r.written).toBe(false);
    expect(r.papers.records.length).toBeGreaterThan(13);
    expect(readFileSync(join(root, 'public/data/grimoire.json'), 'utf8')).toBe(before);
  });
  it('dry-run with fetch writes nothing', async () => {
    const root = sandbox();
    rmSync(join(root, 'public/data'), { recursive: true });
    const fetchImpl = (async () =>
      new Response(readFileSync('tests/fixtures/lit-gdelt-ok.json', 'utf8'))) as typeof fetch;
    const r = await collectLit({ all: true, offline: false, dryRun: true }, root, {
      ...quiet,
      fetchImpl,
    });
    expect(r.written).toBe(false);
    expect(r.news.records.length).toBeGreaterThan(0);
    expect(existsSync(join(root, 'public/data/gazette.json'))).toBe(false);
  });
  it('writes and dedupes on a real run, surviving 429s', async () => {
    const root = sandbox();
    let n = 0;
    const fetchImpl = (async () => {
      n++;
      if (n % 2 === 0) return new Response('{}', { status: 429 });
      return new Response(readFileSync('tests/fixtures/lit-gdelt-ok.json', 'utf8'));
    }) as typeof fetch;
    const r = await collectLit({ all: true, offline: false, dryRun: false }, root, {
      ...quiet,
      fetchImpl,
    });
    expect(r.written).toBe(true);
    const urls = r.news.records.map((x) => x.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(verifyLit(root)).toEqual([]);
  });
});
