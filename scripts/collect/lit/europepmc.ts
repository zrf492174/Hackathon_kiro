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
  license?: string;
  abstractText?: string;
}

/**
 * Maps Europe PMC's explicit licence field. Open access alone says nothing about the licence
 * (CC BY-NC, CC BY-ND and publisher terms are all open access), so only an explicit CC0 record
 * keeps an abstract snippet. Versionless "cc by" is recorded as-is and never snippeted.
 */
function licenseOf(r: EpmcResult): { license: string; snippetLicense?: string } {
  const raw = r.license?.trim().toLowerCase();
  if (r.isOpenAccess === 'Y' && raw === 'cc0')
    return { license: 'CC0-1.0', snippetLicense: 'CC0-1.0' };
  if (r.isOpenAccess === 'Y' && raw === 'cc by') return { license: 'CC BY (version unstated)' };
  return { license: 'Europe PMC metadata' };
}

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
    const { license, snippetLicense } = licenseOf(r);
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
      abstractSnippet: snippetLicense ? snippetFor(snippetLicense, r.abstractText) : undefined,
      source: 'europepmc',
      license,
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
