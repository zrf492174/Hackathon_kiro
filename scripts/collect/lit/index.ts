import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchArxiv, parseArxiv } from './arxiv';
import { searchCrossref, parseCrossref } from './crossref';
import { searchEuropePmc, parseEuropePmc } from './europepmc';
import { searchGdelt, parseGdelt } from './gdelt';
import { searchOpenAlex, parseOpenAlex } from './openalex';
import { dedupeRecords, validateDataset, type Dataset } from './schema';
import { RateLimitError, type LitRecord, type LitSearchOptions, type RawRecord } from './types';
import { parseWikinews, searchWikinews } from './wikinews';

export interface LitArgs {
  all: boolean;
  offline: boolean;
  dryRun: boolean;
}

export function parseLitArgs(argv: string[]): LitArgs {
  return {
    all: argv.includes('--all'),
    offline: argv.includes('--offline'),
    dryRun: argv.includes('--dry-run'),
  };
}

export interface LitConfig {
  maxPapers: number;
  maxNews: number;
  perQuery: number;
  throttleMs: number;
  topics: { topic: string; query: string; kind: 'paper' | 'news' }[];
  paperSources: string[];
  newsSources: string[];
}

type Search = (o: LitSearchOptions) => Promise<RawRecord[]>;
export const SEARCH: Record<string, Search> = {
  openalex: searchOpenAlex,
  crossref: searchCrossref,
  europepmc: searchEuropePmc,
  arxiv: searchArxiv,
  gdelt: searchGdelt,
  wikinews: searchWikinews,
};

const FIXTURE_PARSERS: Record<string, { file: string; parse: (raw: string) => RawRecord[] }> = {
  openalex: { file: 'lit-openalex-ok.json', parse: (s) => parseOpenAlex(JSON.parse(s)) },
  crossref: { file: 'lit-crossref-ok.json', parse: (s) => parseCrossref(JSON.parse(s)) },
  europepmc: { file: 'lit-europepmc-ok.json', parse: (s) => parseEuropePmc(JSON.parse(s)) },
  arxiv: { file: 'lit-arxiv-ok.xml', parse: parseArxiv },
  gdelt: { file: 'lit-gdelt-ok.json', parse: (s) => parseGdelt(JSON.parse(s)) },
  wikinews: { file: 'lit-wikinews-ok.json', parse: (s) => parseWikinews(JSON.parse(s)) },
};

export const PAPERS_PATH = 'public/data/grimoire.json';
export const NEWS_PATH = 'public/data/gazette.json';

const TERMS = {
  paper:
    'Bibliographic metadata only (title, authors, year, venue, DOI, link). Short abstract snippets appear only where the source licence allows. No full text is stored; follow each link for the original work.',
  news: 'Headline, link, domain and date only. No article text is stored. Wikinews items are CC BY 2.5 / CC BY-SA (Wikinews contributors); Wikipedia reference links carry the article title only (text CC BY-SA 4.0, Wikipedia contributors); all other items are links to the original publishers.',
};

function readDataset(path: string, kind: 'paper' | 'news'): Dataset {
  if (!existsSync(path)) {
    return { meta: { generatedAt: '', kind, sources: [], terms: TERMS[kind] }, records: [] };
  }
  return JSON.parse(readFileSync(path, 'utf8')) as Dataset;
}

export interface CollectDeps {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => string;
  log?: (m: string) => void;
}

export interface CollectResult {
  papers: Dataset;
  news: Dataset;
  written: boolean;
}

function build(
  kind: 'paper' | 'news',
  existing: Dataset,
  fresh: LitRecord[],
  cap: number,
  now: string,
): Dataset {
  // Fresh records win; placeholder seeds are only kept while no live data of that kind exists.
  const kept = fresh.some((r) => !r.sample)
    ? existing.records.filter((r) => !r.sample)
    : existing.records;
  const records = dedupeRecords([...fresh, ...kept]).slice(0, cap);
  const sources = [...new Set(records.map((r) => r.source))].sort();
  return { meta: { generatedAt: now, kind, sources, terms: TERMS[kind] }, records };
}

export async function collectLit(
  args: LitArgs,
  root: string,
  deps: CollectDeps = {},
): Promise<CollectResult> {
  const log = deps.log ?? console.log;
  const now = (deps.now ?? (() => new Date().toISOString()))();
  const sleep = deps.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const config = JSON.parse(
    readFileSync(join(root, 'scripts/collect/lit/config.json'), 'utf8'),
  ) as LitConfig;
  const existingPapers = readDataset(join(root, PAPERS_PATH), 'paper');
  const existingNews = readDataset(join(root, NEWS_PATH), 'news');
  const fresh: LitRecord[] = [];

  if (args.offline) {
    for (const [name, fx] of Object.entries(FIXTURE_PARSERS)) {
      const raw = readFileSync(join(root, 'tests/fixtures', fx.file), 'utf8');
      const recs = fx.parse(raw).map((r) => ({
        ...r,
        topic: 'fixture',
        fetchedAt: now,
        sample: true,
        note: 'offline fixture',
      }));
      log(`[offline] ${name}: ${recs.length} record(s) from fixture`);
      fresh.push(...recs);
    }
  } else {
    for (const t of config.topics) {
      const sources = t.kind === 'paper' ? config.paperSources : config.newsSources;
      for (const source of sources) {
        try {
          const res = await SEARCH[source]({
            query: t.query,
            limit: config.perQuery,
            fetchImpl: deps.fetchImpl,
          });
          log(`${source} "${t.query}": ${res.length} record(s)`);
          fresh.push(...res.map((r) => ({ ...r, topic: t.topic, fetchedAt: now })));
        } catch (err) {
          if (err instanceof RateLimitError) log(`${err.message}, skipping job`);
          else log(`search failed for ${source}: ${(err as Error).message}`);
        }
        await sleep(config.throttleMs);
      }
    }
  }

  const papers = build(
    'paper',
    existingPapers,
    fresh.filter((r) => r.kind === 'paper'),
    config.maxPapers,
    now,
  );
  const news = build(
    'news',
    existingNews,
    fresh.filter((r) => r.kind === 'news'),
    config.maxNews,
    now,
  );
  const problems = [...validateDataset(papers, 'paper'), ...validateDataset(news, 'news')];
  if (problems.length) throw new Error(`schema problems:\n - ${problems.join('\n - ')}`);

  const write = !args.offline && !args.dryRun;
  if (write) {
    mkdirSync(join(root, 'public/data'), { recursive: true });
    writeFileSync(join(root, PAPERS_PATH), `${JSON.stringify(papers, null, 2)}\n`);
    writeFileSync(join(root, NEWS_PATH), `${JSON.stringify(news, null, 2)}\n`);
  }
  log(
    `${papers.records.length} paper(s), ${news.records.length} news item(s)` +
      (write ? ' written' : ' (nothing written)'),
  );
  return { papers, news, written: write };
}

/** Validate the committed datasets. Returns problems. */
export function verifyLit(root: string): string[] {
  const problems: string[] = [];
  for (const [path, kind] of [
    [PAPERS_PATH, 'paper'],
    [NEWS_PATH, 'news'],
  ] as const) {
    const full = join(root, path);
    if (!existsSync(full)) {
      problems.push(`${path}: missing`);
      continue;
    }
    problems.push(
      ...validateDataset(JSON.parse(readFileSync(full, 'utf8')), kind).map((p) => `${path}: ${p}`),
    );
  }
  return problems;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const argv = process.argv.slice(2);
  if (argv.includes('--verify')) {
    const problems = verifyLit(process.cwd());
    if (problems.length) {
      console.error(`lit:verify failed with ${problems.length} problem(s):`);
      for (const p of problems) console.error(` - ${p}`);
      process.exit(1);
    }
    console.log('lit:verify ok');
  } else {
    collectLit(parseLitArgs(argv), process.cwd()).catch((e) => {
      console.error(e);
      process.exit(1);
    });
  }
}
