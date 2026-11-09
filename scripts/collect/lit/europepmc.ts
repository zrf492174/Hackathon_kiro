import { getJson, normDoi, snippetFor, type LitSearchOptions, type RawRecord } from './types';

interface EpmcResult {
  id?: string;
  source?: string;
  doi?: string;
  title?: string;
  authorString?: string;
  pubYear?: string;
  journalTitle?: string;
  isOpenAccess?: string;
  abstractText?: string;
}

/** Abstract snippets only for open-access records (licence recorded as CC-BY-4.0 family minimum). */
export function parseEuropePmc(json: { resultList?: { result?: EpmcResult[] } }): RawRecord[] {
  const out: RawRecord[] = [];
  for (const r of json.resultList?.result ?? []) {
    const doi = normDoi(r.doi);
    const url = doi
      ? `https://doi.org/${doi}`
      : r.id && r.source
        ? `https://europepmc.org/article/${r.source}/${r.id}`
        : undefined;
    const title = r.title?.trim().replace(/\.$/, '');
    if (!title || !url) continue;
    const open = r.isOpenAccess === 'Y';
    out.push({
      kind: 'paper',
      id: doi ? `doi:${doi}` : `epmc:${r.source}:${r.id}`,
      title,
      authors: (r.authorString ?? '')
        .replace(/\.$/, '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      year: r.pubYear ? Number(r.pubYear) : undefined,
      venue: r.journalTitle,
      doi,
      url,
      abstractSnippet: open ? snippetFor('CC-BY-4.0', r.abstractText) : undefined,
      source: 'europepmc',
      license: open ? 'CC-BY-4.0' : 'Europe PMC metadata',
    });
  }
  return out;
}

export async function searchEuropePmc(opts: LitSearchOptions): Promise<RawRecord[]> {
  const params = new URLSearchParams({
    query: opts.query,
    format: 'json',
    resultType: 'core',
    pageSize: String(Math.min(opts.limit, 50)),
  });
  const json = await getJson(
    'europepmc',
    `https://www.ebi.ac.uk/europepmc/webservices/rest/search?${params}`,
    opts.fetchImpl,
  );
  return parseEuropePmc(json as { resultList?: { result?: EpmcResult[] } }).slice(0, opts.limit);
}
