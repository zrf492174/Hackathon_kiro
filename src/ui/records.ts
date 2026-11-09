export interface PublicRecord {
  kind: string;
  id: string;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  doi?: string;
  url: string;
  abstractSnippet?: string;
  source: string;
  license: string;
  topic: string;
  sample?: boolean;
}

export interface Dataset {
  meta: { terms?: string; generatedAt?: string };
  records: PublicRecord[];
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only http(s) links are ever rendered as hrefs. */
export function safeUrl(u: string): string | null {
  try {
    const p = new URL(u);
    return p.protocol === 'https:' || p.protocol === 'http:' ? p.href : null;
  } catch {
    return null;
  }
}

export function doiUrl(doi: string): string {
  return `https://doi.org/${doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')}`;
}

/** "Authors (year). Title. Venue." with et al. after three authors. */
export function formatCitation(r: PublicRecord): string {
  const who =
    r.authors.length === 0
      ? 'Anonymous'
      : r.authors.length > 3
        ? `${r.authors.slice(0, 3).join(', ')} et al.`
        : r.authors.join(', ');
  const parts = [`${who}${r.year ? ` (${r.year})` : ''}.`, `${r.title}.`];
  if (r.venue) parts.push(`${r.venue}.`);
  return parts.join(' ');
}

export function filterByTopic(records: PublicRecord[], topic: string): PublicRecord[] {
  return topic === 'all' ? records : records.filter((r) => r.topic === topic);
}

export function topicsOf(records: PublicRecord[]): string[] {
  return [...new Set(records.map((r) => r.topic))].sort();
}

/** Clamp a page index into [0, count-1]. */
export function clampPage(index: number, count: number): number {
  return Math.max(0, Math.min(index, Math.max(0, count - 1)));
}

export async function loadDataset(
  name: string,
  fetchImpl: typeof fetch = fetch,
  base: string = import.meta.env.BASE_URL,
): Promise<Dataset | null> {
  try {
    const res = await fetchImpl(`${base}data/${name}`);
    if (!res.ok) return null;
    const data = (await res.json()) as Dataset;
    return Array.isArray(data.records) ? data : null;
  } catch {
    return null;
  }
}
