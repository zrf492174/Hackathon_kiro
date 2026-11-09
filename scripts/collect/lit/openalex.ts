import { getJson, normDoi, snippetFor, type LitSearchOptions, type RawRecord } from './types';

interface OAWork {
  id?: string;
  doi?: string | null;
  title?: string | null;
  publication_year?: number | null;
  primary_location?: {
    landing_page_url?: string | null;
    source?: { display_name?: string | null } | null;
  } | null;
  authorships?: { author?: { display_name?: string } }[];
  abstract_inverted_index?: Record<string, number[]> | null;
}

function abstractText(idx: Record<string, number[]> | null | undefined): string | undefined {
  if (!idx) return undefined;
  const words: string[] = [];
  for (const [w, positions] of Object.entries(idx)) for (const p of positions) words[p] = w;
  return words.filter(Boolean).join(' ');
}

/** OpenAlex metadata is CC0, so short abstract snippets are allowed. */
export function parseOpenAlex(json: { results?: OAWork[] }): RawRecord[] {
  const out: RawRecord[] = [];
  for (const w of json.results ?? []) {
    const doi = normDoi(w.doi);
    const url = doi ? `https://doi.org/${doi}` : w.primary_location?.landing_page_url;
    if (!w.title?.trim() || !url) continue;
    out.push({
      kind: 'paper',
      id: doi ? `doi:${doi}` : `openalex:${w.id ?? url}`,
      title: w.title.trim(),
      authors: (w.authorships ?? []).map((a) => a.author?.display_name ?? '').filter(Boolean),
      year: w.publication_year ?? undefined,
      venue: w.primary_location?.source?.display_name ?? undefined,
      doi,
      url,
      abstractSnippet: snippetFor('CC0-1.0', abstractText(w.abstract_inverted_index)),
      source: 'openalex',
      license: 'CC0-1.0',
    });
  }
  return out;
}

export async function searchOpenAlex(opts: LitSearchOptions): Promise<RawRecord[]> {
  const params = new URLSearchParams({
    search: opts.query,
    per_page: String(Math.min(opts.limit, 50)),
  });
  const json = await getJson(
    'openalex',
    `https://api.openalex.org/works?${params}`,
    opts.fetchImpl,
  );
  return parseOpenAlex(json as { results?: OAWork[] }).slice(0, opts.limit);
}
