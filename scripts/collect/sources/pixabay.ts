import { licenseUrl } from '../license';
import { RateLimitError, USER_AGENT, type Candidate, type SearchOptions } from './types';

interface PixabayHit {
  pageURL?: string;
  largeImageURL?: string;
  webformatURL?: string;
  user?: string;
  user_id?: number;
  imageWidth?: number;
  imageHeight?: number;
  tags?: string;
}

/** Pixabay content is under the Pixabay license, no attribution required. */
export function parsePixabay(json: { hits?: PixabayHit[] }): Candidate[] {
  const out: Candidate[] = [];
  for (const h of json.hits ?? []) {
    const download = h.largeImageURL || h.webformatURL;
    if (!h.pageURL || !download) continue;
    const tags = (h.tags ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    out.push({
      provider: 'pixabay',
      pageUrl: h.pageURL,
      downloadUrl: download,
      title: tags[0] || 'Untitled',
      author: h.user?.trim() || 'Unknown',
      authorUrl:
        h.user && h.user_id ? `https://pixabay.com/users/${h.user}-${h.user_id}/` : undefined,
      license: 'PIXABAY',
      licenseUrl: licenseUrl('PIXABAY'),
      attributionRequired: false,
      width: h.imageWidth,
      height: h.imageHeight,
      tags,
    });
  }
  return out;
}

export async function searchPixabay(opts: SearchOptions): Promise<Candidate[]> {
  const key = process.env.PIXABAY_KEY;
  if (!key) {
    console.warn('pixabay: PIXABAY_KEY not set, skipping');
    return [];
  }
  const f = opts.fetchImpl ?? fetch;
  const params = new URLSearchParams({
    key,
    q: opts.query,
    image_type: 'all',
    per_page: String(Math.min(Math.max(opts.limit, 3), 200)),
  });
  const res = await f(`https://pixabay.com/api/?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (res.status === 429) throw new RateLimitError('pixabay');
  if (!res.ok) throw new Error(`pixabay: HTTP ${res.status}`);
  return parsePixabay(await res.json()).slice(0, opts.limit);
}
