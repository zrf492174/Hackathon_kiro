import { getJson, type LitSearchOptions, type RawRecord } from './types';

interface WnHit {
  title?: string;
  timestamp?: string;
}

/** Wikinews text is CC BY 2.5 (some pages CC BY-SA); only title, link and date are kept. */
export function parseWikinews(json: { query?: { search?: WnHit[] } }): RawRecord[] {
  const out: RawRecord[] = [];
  for (const h of json.query?.search ?? []) {
    if (!h.title?.trim()) continue;
    const url = `https://en.wikinews.org/wiki/${encodeURIComponent(h.title.trim().replace(/ /g, '_'))}`;
    out.push({
      kind: 'news',
      id: `url:${url}`,
      title: h.title.trim(),
      authors: [],
      year: h.timestamp ? Number(h.timestamp.slice(0, 4)) : undefined,
      venue: 'Wikinews',
      url,
      source: 'wikinews',
      license: 'CC BY 2.5 / CC BY-SA (Wikinews contributors)',
    });
  }
  return out;
}

export async function searchWikinews(opts: LitSearchOptions): Promise<RawRecord[]> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: opts.query,
    srlimit: String(Math.min(opts.limit, 50)),
    format: 'json',
    origin: '*',
  });
  const json = await getJson(
    'wikinews',
    `https://en.wikinews.org/w/api.php?${params}`,
    opts.fetchImpl,
  );
  return parseWikinews(json as { query?: { search?: WnHit[] } }).slice(0, opts.limit);
}
