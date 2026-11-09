import { licenseUrl, normalizeLicense, requiresAttribution, type License } from '../license';
import { RateLimitError, USER_AGENT, type Candidate, type SearchOptions } from './types';

interface FreesoundResult {
  name?: string;
  url?: string;
  username?: string;
  license?: string;
  tags?: string[];
  previews?: Record<string, string>;
}

/** Maps Freesound license URLs to ids; NC and sampling licenses are rejected. */
export function freesoundLicense(url: string | undefined): License | null {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('/publicdomain/zero/')) return normalizeLicense('cc0');
  const m = /\/licenses\/by\/(\d\.\d)\//.exec(u);
  if (m) return normalizeLicense('by', m[1]);
  return null;
}

export function parseFreesound(json: { results?: FreesoundResult[] }): Candidate[] {
  const out: Candidate[] = [];
  for (const r of json.results ?? []) {
    const license = freesoundLicense(r.license);
    const preview = r.previews?.['preview-hq-mp3'] ?? r.previews?.['preview-lq-mp3'];
    if (!license || !r.url || !preview) continue;
    const attributionRequired = requiresAttribution(license);
    if (attributionRequired && !r.username) continue;
    out.push({
      provider: 'freesound',
      pageUrl: r.url,
      downloadUrl: preview,
      title: r.name?.trim() || 'Untitled',
      author: r.username?.trim() || 'Unknown',
      authorUrl: r.username ? `https://freesound.org/people/${r.username}/` : undefined,
      license,
      licenseUrl: licenseUrl(license),
      attributionRequired,
      tags: r.tags ?? [],
    });
  }
  return out;
}

export async function searchFreesound(opts: SearchOptions): Promise<Candidate[]> {
  const key = process.env.FREESOUND_KEY;
  if (!key) {
    console.warn('freesound: FREESOUND_KEY not set, skipping');
    return [];
  }
  const f = opts.fetchImpl ?? fetch;
  const params = new URLSearchParams({
    query: opts.query,
    fields: 'name,url,username,license,tags,previews',
    page_size: String(Math.min(opts.limit, 50)),
    token: key,
  });
  const res = await f(`https://freesound.org/apiv2/search/text/?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (res.status === 429) throw new RateLimitError('freesound');
  if (!res.ok) throw new Error(`freesound: HTTP ${res.status}`);
  return parseFreesound(await res.json()).slice(0, opts.limit);
}
