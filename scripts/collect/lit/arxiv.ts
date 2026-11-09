import { getJson, normDoi, type LitSearchOptions, type RawRecord } from './types';

const tag = (xml: string, name: string): string | undefined => {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(xml);
  return m ? decode(m[1].replace(/\s+/g, ' ').trim()) : undefined;
};

function decode(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Atom parser. arXiv abstracts carry mixed licences, so they are never kept. */
export function parseArxiv(xml: string): RawRecord[] {
  const out: RawRecord[] = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const url = tag(e, 'id')?.replace(/^http:/, 'https:');
    const title = tag(e, 'title');
    if (!url || !title) continue;
    const doi = normDoi(tag(e, 'arxiv:doi'));
    const published = tag(e, 'published');
    out.push({
      kind: 'paper',
      id: doi ? `doi:${doi}` : `arxiv:${url.replace(/^https:\/\/arxiv\.org\/abs\//, '')}`,
      title,
      authors: [...e.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/g)].map((a) =>
        decode(a[1].trim()),
      ),
      year: published ? Number(published.slice(0, 4)) : undefined,
      venue: 'arXiv',
      doi,
      url,
      source: 'arxiv',
      license: 'arXiv metadata (CC0)',
    });
  }
  return out;
}

export async function searchArxiv(opts: LitSearchOptions): Promise<RawRecord[]> {
  const params = new URLSearchParams({
    search_query: `all:${opts.query}`,
    max_results: String(Math.min(opts.limit, 50)),
  });
  const xml = await getJson(
    'arxiv',
    `https://export.arxiv.org/api/query?${params}`,
    opts.fetchImpl,
    true,
  );
  return parseArxiv(xml as string).slice(0, opts.limit);
}
