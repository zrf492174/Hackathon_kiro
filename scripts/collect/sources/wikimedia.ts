import { licenseUrl, normalizeLicense, requiresAttribution } from '../license';
import { RateLimitError, USER_AGENT, type Candidate, type SearchOptions } from './types';

interface Meta {
  value?: string;
}
interface WikiPage {
  title?: string;
  imageinfo?: {
    url?: string;
    descriptionurl?: string;
    width?: number;
    height?: number;
    extmetadata?: Record<string, Meta | undefined>;
  }[];
}

const stripHtml = (s: string) =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function parseWikimedia(json: {
  query?: { pages?: Record<string, WikiPage> };
}): Candidate[] {
  const out: Candidate[] = [];
  for (const page of Object.values(json.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];
    if (!info?.url || !info.descriptionurl) continue;
    const meta = info.extmetadata ?? {};
    const license = normalizeLicense(meta.LicenseShortName?.value);
    if (!license) continue;
    const author = meta.Artist?.value ? stripHtml(meta.Artist.value) : '';
    const attributionRequired = requiresAttribution(license);
    if (attributionRequired && !author) continue;
    out.push({
      provider: 'wikimedia',
      pageUrl: info.descriptionurl,
      downloadUrl: info.url,
      title: (meta.ObjectName?.value ?? page.title ?? 'Untitled').replace(/^File:/, '').trim(),
      author: author || 'Unknown',
      license,
      licenseUrl: meta.LicenseUrl?.value ?? licenseUrl(license),
      attributionRequired,
      width: info.width,
      height: info.height,
      tags: [],
    });
  }
  return out;
}

export async function searchWikimedia(opts: SearchOptions): Promise<Candidate[]> {
  const f = opts.fetchImpl ?? fetch;
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: opts.query,
    gsrnamespace: '6',
    gsrlimit: String(Math.min(opts.limit, 50)),
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
  });
  const res = await f(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (res.status === 429) throw new RateLimitError('wikimedia');
  if (!res.ok) throw new Error(`wikimedia: HTTP ${res.status}`);
  return parseWikimedia(await res.json()).slice(0, opts.limit);
}
