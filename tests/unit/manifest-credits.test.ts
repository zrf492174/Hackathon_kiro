import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateCredits } from '../../scripts/collect/credits';
import { sha256 } from '../../scripts/collect/dedupe';
import { saveManifest, validateAsset, type ManifestAsset } from '../../scripts/collect/manifest';
import { toEntry } from '../../scripts/collect/index';
import { buildJobs, parseArgs } from '../../scripts/collect/index';
import { verifyAssets } from '../../scripts/verify-assets';

const base = (over: Partial<ManifestAsset> = {}): ManifestAsset => ({
  id: 'img-1',
  type: 'image',
  category: 'ghosts',
  file: 'images/ghosts/a.png',
  bytes: 3,
  sha256: sha256('abc'),
  source: {
    provider: 'openverse',
    pageUrl: 'https://e.org/1',
    downloadUrl: 'https://e.org/1.png',
    fetchedAt: 'now',
  },
  author: 'Ann',
  title: 'Ghost | one',
  license: 'CC-BY-4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  attributionRequired: true,
  modified: false,
  tags: [],
  status: 'approved',
  ...over,
});

describe('manifest validation', () => {
  it('accepts a valid asset', () => expect(validateAsset(base())).toEqual([]));
  it('rejects bad license, status, missing author', () => {
    expect(validateAsset(base({ license: 'CC-BY-NC-4.0' })).length).toBeGreaterThan(0);
    expect(validateAsset(base({ status: 'weird' as never })).length).toBeGreaterThan(0);
    expect(validateAsset(base({ author: '' })).join()).toContain('author missing');
  });
});

describe('credits', () => {
  it('lists approved only, grouped by category, escapes pipes', () => {
    const md = generateCredits({
      version: 1,
      generatedAt: '',
      assets: [base(), base({ id: 'img-2', status: 'pending', title: 'Hidden' })],
    });
    expect(md).toContain('## image/ghosts');
    expect(md).toContain('Ghost \\| one');
    expect(md).not.toContain('Hidden');
  });
});

describe('verifyAssets', () => {
  function setup(asset: ManifestAsset, content = 'abc', extra?: string) {
    const dir = mkdtempSync(join(tmpdir(), 'assets-'));
    mkdirSync(join(dir, 'images/ghosts'), { recursive: true });
    writeFileSync(join(dir, asset.file), content);
    if (extra) writeFileSync(join(dir, extra), 'x');
    saveManifest(join(dir, 'manifest.json'), { version: 1, generatedAt: '', assets: [asset] });
    return dir;
  }
  it('passes for consistent assets', () => expect(verifyAssets(setup(base()))).toEqual([]));
  it('fails on sha mismatch', () =>
    expect(verifyAssets(setup(base(), 'zzz')).join()).toContain('sha256 mismatch'));
  it('fails on orphan file', () =>
    expect(verifyAssets(setup(base(), 'abc', 'images/ghosts/orphan.png')).join()).toContain(
      'no manifest record',
    ));
  it('fails on non-whitelisted license', () =>
    expect(verifyAssets(setup(base({ license: 'CC-BY-NC-4.0' }))).join()).toContain(
      'not whitelisted',
    ));
  it('fails when manifest is missing', () => {
    expect(verifyAssets(mkdtempSync(join(tmpdir(), 'assets-')))).toEqual([
      'manifest.json is missing',
    ]);
  });
});

describe('collect cli helpers', () => {
  it('parses flags', () => {
    const a = parseArgs([
      '--offline',
      '--dry-run',
      '--source=openverse',
      '--query=q',
      '--limit=3',
      '--category=ghosts',
    ]);
    expect(a).toMatchObject({
      offline: true,
      dryRun: true,
      source: 'openverse',
      query: 'q',
      limit: 3,
      category: 'ghosts',
    });
  });
  it('builds jobs from config and requires args otherwise', () => {
    const cfg = {
      minWidth: 1,
      categories: [{ category: 'c', queries: ['a', 'b'], sources: ['openverse'], limit: 2 }],
    };
    expect(buildJobs({ all: true, offline: false, dryRun: false }, cfg)).toHaveLength(2);
    expect(() => buildJobs({ all: false, offline: false, dryRun: false }, cfg)).toThrow();
  });
  it('new candidates become pending entries', () => {
    const e = toEntry(
      {
        provider: 'openverse',
        pageUrl: 'p',
        downloadUrl: 'd',
        title: 't',
        author: 'a',
        license: 'CC0-1.0',
        licenseUrl: 'u',
        attributionRequired: false,
        tags: [],
      },
      'ghosts',
      'images/ghosts/x.png',
      new Uint8Array([1, 2]),
      'now',
    );
    expect(e.status).toBe('pending');
    expect(e.id).toMatch(/^img-openverse-/);
  });
});
