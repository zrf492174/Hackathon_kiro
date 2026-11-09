import { getJson, normDoi, type LitSearchOptions, type RawRecord } from './types';

interface CRItem {
  DOI?: string;
  URL?: string;
  title?: string[];
  author?: { given?: string; family?: string; name?: string }[];
  issued?: { 'date-parts'?: (number | null)[][] };
  'container-title'?: string[];
}

/** Crossref metadata is factual and open; abstracts are never taken. */
export function parseCrossref(json: { message?: { items?: CRItem[] } }): RawRecord[] {
  const out: RawRecord[] = [];
  for (const it of json.message?.items ?? []) {
    const doi = normDoi(it.DOI);
    const title = it.title?.[0]?.trim();
    if (!doi || !title) continue;
    out.push({
      kind: 'paper',
      id: `doi:${doi}`,
      title,
      authors: (it.author ?? [])
        .map((a) => a.name ?? [a.given, a.family].filter(Boolean).join(' '))
        .filter(Boolean),
      year: it.issued?.['date-parts']?.[0]?.[0] ?? undefined,
      venue: it['container-title']?.[0],
      doi,
      url: `https://doi.org/${doi}`,
      source: 'crossref',
      license: 'Crossref metadata (open facts)',
    });
  }
  return out;
}

export async function searchCrossref(opts: LitSearchOptions): Promise<RawRecord[]> {
  const params = new URLSearchParams({
    query: opts.query,
    rows: String(Math.min(opts.limit, 50)),
    mailto: 'haunted-hollow@users.noreply.github.com',
  });
  const json = await getJson(
    'crossref',
    `https://api.crossref.org/works?${params}`,
    opts.fetchImpl,
  );
  return parseCrossref(json as { message?: { items?: CRItem[] } }).slice(0, opts.limit);
}
