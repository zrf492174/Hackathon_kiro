import type { LitRecord } from './types';

export interface Dataset {
  meta: {
    generatedAt: string;
    kind: 'paper' | 'news';
    sources: string[];
    terms: string;
  };
  records: LitRecord[];
}

/** Validate one record, returning human readable problems. */
export function validateRecord(r: Partial<LitRecord>, label: string): string[] {
  const e: string[] = [];
  if (r.kind !== 'paper' && r.kind !== 'news') e.push(`${label}: bad kind`);
  for (const k of ['id', 'title', 'url', 'source', 'license', 'topic', 'fetchedAt'] as const) {
    if (typeof r[k] !== 'string' || !r[k]) e.push(`${label}: missing ${k}`);
  }
  if (typeof r.url === 'string' && !/^https:\/\//.test(r.url)) e.push(`${label}: url not https`);
  if (!Array.isArray(r.authors)) e.push(`${label}: authors must be an array`);
  if (r.year !== undefined && (!Number.isInteger(r.year) || r.year < 1000 || r.year > 2100)) {
    e.push(`${label}: bad year`);
  }
  if (r.abstractSnippet !== undefined && r.abstractSnippet.length > 300) {
    e.push(`${label}: abstractSnippet over 300 chars`);
  }
  if (r.doi !== undefined && !/^10\.\d{4,9}\/\S+$/.test(r.doi)) e.push(`${label}: bad doi`);
  if (r.sample && !r.note) e.push(`${label}: sample entries need a note`);
  return e;
}

export function validateDataset(d: Partial<Dataset>, kind: 'paper' | 'news'): string[] {
  const e: string[] = [];
  if (!d.meta?.generatedAt || !d.meta.terms || !Array.isArray(d.meta.sources)) {
    e.push('meta incomplete (generatedAt, sources, terms)');
  }
  if (!Array.isArray(d.records)) return [...e, 'records must be an array'];
  const seen = new Set<string>();
  d.records.forEach((r, i) => {
    e.push(...validateRecord(r, `${kind}[${i}]`));
    if (r.kind !== kind) e.push(`${kind}[${i}]: wrong kind ${r.kind}`);
    const key = r.doi ?? r.url;
    if (seen.has(key)) e.push(`${kind}[${i}]: duplicate ${key}`);
    seen.add(key);
  });
  return e;
}

/** Dedupe by DOI, falling back to URL. First occurrence wins. */
export function dedupeRecords<T extends { doi?: string; url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((r) => {
    const key = r.doi ?? r.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
