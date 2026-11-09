import { licenseUrl } from '../license';
import { RateLimitError, USER_AGENT, type Candidate, type SearchOptions } from './types';

interface UnsplashPhoto {
  description?: string | null;
  alt_description?: string | null;
  width?: number;
  height?: number;
  urls?: { regular?: string; full?: string };
  links?: { html?: string };
  user?: { name?: string; links?: { html?: string } };
  tags?: { title: string }[];
}

/** Unsplash photos use the Unsplash license; the author is still recorded in the manifest. */
export function parseUnsplash(json: { results?: UnsplashPhoto[] }): Candidate[] {
  const out: Candidate[] = [];
  for (const p of json.results ?? []) {
    const download = p.urls?.regular ?? p.urls?.full;
    const page = p.links?.html;
    if (!download || !page) continue;
    out.push({
      provider: 'unsplash',
      pageUrl: page,
      downloadUrl: download,
      title: (p.description ?? p.alt_description)?.trim() || 'Untitled',
      author: p.user?.name?.trim() || 'Unknown',
      authorUrl: p.user?.links?.html,
      license: 'UNSPLASH',
      licenseUrl: licenseUrl('UNSPLASH'),
      attributionRequired: false,
      width: p.width,
      height: p.height,
      tags: (p.tags ?? []).map((t) => t.title),
    });
  }
  return out;
}

export async function searchUnsplash(opts: SearchOptions): Promise<Candidate[]> {
  const key = process.env.UNSPLASH_KEY;
  if (!key) {
    console.warn('unsplash: UNSPLASH_KEY not set, skipping');
    return [];
  }
  const f = opts.fetchImpl ?? fetch;
  const params = new URLSearchParams({
    query: opts.query,
    per_page: String(Math.min(opts.limit, 30)),
  });
  const res = await f(`https://api.unsplash.com/search/photos?${params}`, {
    headers: { 'User-Agent': USER_AGENT, Authorization: `Client-ID ${key}` },
  });
  if (res.status === 429) throw new RateLimitError('unsplash');
  if (!res.ok) throw new Error(`unsplash: HTTP ${res.status}`);
  return parseUnsplash(await res.json()).slice(0, opts.limit);
}
