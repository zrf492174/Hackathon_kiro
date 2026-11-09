import { licenseUrl, normalizeLicense, requiresAttribution } from '../license';
import { RateLimitError, type Candidate, type SearchOptions } from './types';

interface OpenverseResult {
  title?: string;
  url?: string;
  foreign_landing_url?: string;
  creator?: string | null;
  creator_url?: string | null;
  license?: string | null;
  license_version?: string | null;
  width?: number | null;
  height?: number | null;
  tags?: { name: string }[];
}

/** Pure parser: drops results with an unknown or non-whitelisted license or missing urls. */
export function parseOpenverse(json: { results?: OpenverseResult[] }): Candidate[] {
  const out: Candidate[] = [];
  for (const r of json.results ?? []) {
    const license = normalizeLicense(r.license, r.license_version);
    if (!license || !r.url || !r.foreign_landing_url) continue;
    const attributionRequired = requiresAttribution(license);
    if (attributionRequired && !r.creator) continue;
    out.push({
      provider: 'openverse',
      pageUrl: r.foreign_landing_url,
      downloadUrl: r.url,
      title: r.title?.trim() || 'Untitled',
      author: r.creator?.trim() || 'Unknown',
      authorUrl: r.creator_url ?? undefined,
      license,
      licenseUrl: licenseUrl(license),
      attributionRequired,
      width: r.width ?? undefined,
      height: r.height ?? undefined,
      tags: (r.tags ?? []).map((t) => t.name),
    });
  }
  return out;
}

export async function searchOpenverse(opts: SearchOptions): Promise<Candidate[]> {
  const f = opts.fetchImpl ?? fetch;
  const params = new URLSearchParams({
    q: opts.query,
    license: 'cc0,pdm,by',
    page_size: String(Math.min(opts.limit, 50)),
  });
  const res = await f(`https://api.openverse.org/v1/images/?${params}`);
  if (res.status === 429) throw new RateLimitError('openverse');
  if (!res.ok) throw new Error(`openverse: HTTP ${res.status}`);
  return parseOpenverse(await res.json()).slice(0, opts.limit);
}
