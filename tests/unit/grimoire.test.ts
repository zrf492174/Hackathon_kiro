import { describe, expect, it } from 'vitest';
import {
  clampPage,
  doiUrl,
  escapeHtml,
  filterByTopic,
  formatCitation,
  loadDataset,
  safeUrl,
  topicsOf,
  type PublicRecord,
} from '../../src/ui/records';
import { renderSpell } from '../../src/ui/grimoire';
import { renderItem } from '../../src/ui/gazette';
import { parseSceneId, SCENES } from '../../src/scenes';

const rec = (o: Partial<PublicRecord> = {}): PublicRecord => ({
  kind: 'paper',
  id: 'x',
  title: 'A title',
  authors: ['Ann', 'Bob'],
  year: 1818,
  venue: 'Journal',
  url: 'https://example.org/p',
  source: 'seed',
  license: 'facts',
  topic: 'a',
  ...o,
});

describe('records helpers', () => {
  it('escapes html', () => {
    expect(escapeHtml('<img src=x onerror="a">&\'')).toBe(
      '&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;',
    );
  });
  it('builds doi urls', () => {
    expect(doiUrl('10.1/abc')).toBe('https://doi.org/10.1/abc');
    expect(doiUrl('https://doi.org/10.1/abc')).toBe('https://doi.org/10.1/abc');
  });
  it('rejects unsafe urls', () => {
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    expect(safeUrl('https://a.org/x')).toBe('https://a.org/x');
  });
  it('formats citations', () => {
    expect(formatCitation(rec())).toBe('Ann, Bob (1818). A title. Journal.');
    expect(formatCitation(rec({ authors: ['a', 'b', 'c', 'd'] }))).toContain('a, b, c et al.');
    expect(formatCitation(rec({ authors: [], year: undefined, venue: undefined }))).toBe(
      'Anonymous. A title.',
    );
  });
  it('filters and paginates', () => {
    const rs = [rec({ topic: 'a' }), rec({ topic: 'b' }), rec({ topic: 'a' })];
    expect(filterByTopic(rs, 'a')).toHaveLength(2);
    expect(filterByTopic(rs, 'all')).toHaveLength(3);
    expect(topicsOf(rs)).toEqual(['a', 'b']);
    expect(clampPage(-1, 3)).toBe(0);
    expect(clampPage(9, 3)).toBe(2);
    expect(clampPage(1, 0)).toBe(0);
  });
  it('loads datasets and falls back to null', async () => {
    const ok = (async () => ({ ok: true, json: async () => ({ meta: {}, records: [] }) })) as never;
    expect(await loadDataset('g.json', ok, '/b/')).not.toBeNull();
    const bad = (async () => {
      throw new Error('offline');
    }) as never;
    expect(await loadDataset('g.json', bad, '/b/')).toBeNull();
  });
});

describe('rendering', () => {
  it('escapes titles and sets safe link attributes', () => {
    const html = renderSpell(
      rec({ title: '<script>x</script>', doi: '10.1/z', sample: true }),
      0,
      2,
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('href="https://doi.org/10.1/z"');
    expect(html).toContain('sample');
  });
  it('renders abstract only when present', () => {
    expect(renderSpell(rec(), 0, 1)).not.toContain('spell__abstract');
    expect(renderSpell(rec({ abstractSnippet: 'hi' }), 0, 1)).toContain('spell__abstract');
  });
  it('renders gazette items with licence text', () => {
    const html = renderItem(rec({ title: '<b>n</b>', license: 'Link only' }));
    expect(html).toContain('&lt;b&gt;');
    expect(html).toContain('Link only');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});

describe('scene ids', () => {
  it('parses the new scenes', () => {
    for (const id of ['castle', 'lab', 'library', 'gazette']) {
      expect(parseSceneId(`#${id}`)).toBe(id);
      expect(SCENES.some((s) => s.id === id)).toBe(true);
    }
    expect(parseSceneId('nope')).toBe('gate');
  });
});
