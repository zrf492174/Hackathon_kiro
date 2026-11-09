export const LIT_USER_AGENT =
  'HauntedHollowLiteratureCollector/0.1 (https://github.com/zrf492174/Hackathon_kiro; mailto:haunted-hollow@users.noreply.github.com)';

export type RecordKind = 'paper' | 'news';

/** Metadata-only record. Never contains full text. */
export interface LitRecord {
  kind: RecordKind;
  id: string;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  doi?: string;
  url: string;
  /** Max 300 chars, only present when the source licence permits reuse. */
  abstractSnippet?: string;
  source: string;
  license: string;
  topic: string;
  fetchedAt: string;
  /** True for hand-seeded entries that have not been confirmed by a live collect. */
  sample?: boolean;
  note?: string;
}

export interface LitSearchOptions {
  query: string;
  limit: number;
  fetchImpl?: typeof fetch;
}

/** Parsed adapter output, before topic/fetchedAt are stamped on. */
export type RawRecord = Omit<LitRecord, 'topic' | 'fetchedAt'>;

export class RateLimitError extends Error {
  constructor(public provider: string) {
    super(`${provider}: rate limited (HTTP 429)`);
  }
}

export const SNIPPET_MAX = 300;
/** Licences under which short abstract snippets may be redistributed. */
const SNIPPET_OK = new Set(['CC0-1.0', 'CC-BY-4.0', 'PD']);

/** Returns a trimmed snippet only when the licence permits it. */
export function snippetFor(license: string, text: string | null | undefined): string | undefined {
  if (!text || !SNIPPET_OK.has(license)) return undefined;
  const clean = text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return undefined;
  return clean.length <= SNIPPET_MAX ? clean : `${clean.slice(0, SNIPPET_MAX - 3).trimEnd()}...`;
}

export function normDoi(doi: string | null | undefined): string | undefined {
  if (!doi) return undefined;
  const d = doi
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .trim()
    .toLowerCase();
  return d || undefined;
}

export async function getJson(
  provider: string,
  url: string,
  f: typeof fetch = fetch,
  asText = false,
): Promise<unknown> {
  const res = await f(url, { headers: { 'User-Agent': LIT_USER_AGENT } });
  if (res.status === 429) throw new RateLimitError(provider);
  if (!res.ok) throw new Error(`${provider}: HTTP ${res.status}`);
  return asText ? res.text() : res.json();
}
