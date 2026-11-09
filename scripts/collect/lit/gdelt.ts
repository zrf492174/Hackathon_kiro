import { getJson, type LitSearchOptions, type RawRecord } from './types';

interface GdeltArticle {
  url?: string;
  title?: string;
  domain?: string;
  seendate?: string;
}

/** Link, title, domain and date only. No article text is ever stored. */
export function parseGdelt(json: { articles?: GdeltArticle[] }): RawRecord[] {
  const out: RawRecord[] = [];
  for (const a of json.articles ?? []) {
    if (!a.url || !a.title?.trim()) continue;
    out.push({
      kind: 'news',
      id: `url:${a.url}`,
      title: a.title.trim(),
      authors: [],
      year: a.seendate ? Number(a.seendate.slice(0, 4)) : undefined,
      venue: a.domain,
      url: a.url,
      source: 'gdelt',
      license: 'Link and headline metadata only (GDELT)',
    });
  }
  return out;
}

export async function searchGdelt(opts: LitSearchOptions): Promise<RawRecord[]> {
  const params = new URLSearchParams({
    query: opts.query,
    mode: 'artlist',
    format: 'json',
    maxrecords: String(Math.min(opts.limit, 75)),
  });
  const json = await getJson(
    'gdelt',
    `https://api.gdeltproject.org/api/v2/doc/doc?${params}`,
    opts.fetchImpl,
  );
  return parseGdelt(json as { articles?: GdeltArticle[] }).slice(0, opts.limit);
}
