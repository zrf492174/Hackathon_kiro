import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyAssets } from '../verify-assets';
import { writeCredits } from './credits';
import { dedupe, sha256 } from './dedupe';
import { loadManifest, saveManifest, type Manifest, type ManifestAsset } from './manifest';
import { searchOpenverse } from './sources/openverse';
import { RateLimitError, USER_AGENT, type Candidate } from './sources/types';
import { searchWikimedia } from './sources/wikimedia';

export interface Args {
  source?: string;
  query?: string;
  limit?: number;
  category?: string;
  all: boolean;
  offline: boolean;
  dryRun: boolean;
}

export function parseArgs(argv: string[]): Args {
  const args: Args = { all: false, offline: false, dryRun: false };
  for (const raw of argv) {
    if (raw === '--all') args.all = true;
    else if (raw === '--offline') args.offline = true;
    else if (raw === '--dry-run') args.dryRun = true;
    else if (raw.startsWith('--source=')) args.source = raw.slice(9);
    else if (raw.startsWith('--query=')) args.query = raw.slice(8);
    else if (raw.startsWith('--category=')) args.category = raw.slice(11);
    else if (raw.startsWith('--limit=')) args.limit = Number(raw.slice(8));
  }
  return args;
}

export const MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024;

const TYPE_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

/** Map a response content-type to a file extension, or null if it is not an allowed image type. */
export function extensionForType(type: string | null): string | null {
  const base = type?.split(';')[0]?.trim().toLowerCase() ?? '';
  return TYPE_EXT[base] ?? null;
}

interface Job {
  source: string;
  query: string;
  category: string;
  limit: number;
}

interface Config {
  minWidth: number;
  categories: { category: string; queries: string[]; sources: string[]; limit: number }[];
}

export function buildJobs(args: Args, config: Config): Job[] {
  if (args.all) {
    return config.categories.flatMap((c) =>
      c.queries.flatMap((query) =>
        c.sources.map((source) => ({ source, query, category: c.category, limit: c.limit })),
      ),
    );
  }
  if (!args.source || !args.query || !args.category) {
    throw new Error('need --source, --query and --category (or --all)');
  }
  return [
    { source: args.source, query: args.query, category: args.category, limit: args.limit ?? 20 },
  ];
}

const SEARCH = { openverse: searchOpenverse, wikimedia: searchWikimedia } as const;

export function toEntry(
  c: Candidate,
  category: string,
  file: string,
  bytes: Uint8Array,
  now: string,
): ManifestAsset {
  const hash = sha256(bytes);
  return {
    id: `img-${c.provider}-${hash.slice(0, 6)}`,
    type: 'image',
    category,
    file,
    width: c.width,
    height: c.height,
    bytes: bytes.byteLength,
    sha256: hash,
    source: {
      provider: c.provider,
      pageUrl: c.pageUrl,
      downloadUrl: c.downloadUrl,
      fetchedAt: now,
    },
    author: c.author,
    authorUrl: c.authorUrl,
    title: c.title,
    license: c.license,
    licenseUrl: c.licenseUrl,
    attributionRequired: c.attributionRequired,
    modified: false,
    tags: c.tags,
    status: 'pending',
  };
}

async function collect(args: Args, root: string): Promise<void> {
  const assetsDir = join(root, 'public/assets');
  const manifestPath = join(assetsDir, 'manifest.json');

  if (args.offline) {
    const errors = verifyAssets(assetsDir);
    console.log(`[offline] validated existing manifest: ${errors.length} problem(s)`);
    for (const e of errors) console.error(` - ${e}`);
    if (errors.length) process.exit(1);
    if (args.dryRun) console.log('[dry-run] nothing written');
    return;
  }

  const config = JSON.parse(
    readFileSync(join(root, 'scripts/collect/config.json'), 'utf8'),
  ) as Config;
  const jobs = buildJobs(args, config);
  const manifest: Manifest = loadManifest(manifestPath);
  const now = new Date().toISOString();
  let added = 0;

  for (const job of jobs) {
    const search = SEARCH[job.source as keyof typeof SEARCH];
    if (!search) {
      console.warn(`unknown source ${job.source}, skipped`);
      continue;
    }
    let candidates: Candidate[];
    try {
      candidates = await search({ query: job.query, limit: job.limit });
    } catch (err) {
      if (err instanceof RateLimitError) console.warn(`${err.message}, skipping job`);
      else console.warn(`search failed for ${job.source}: ${(err as Error).message}`);
      continue;
    }
    candidates = candidates.filter((c) => (c.width ?? config.minWidth) >= config.minWidth);
    console.log(`${job.source} "${job.query}": ${candidates.length} licensed candidate(s)`);
    if (args.dryRun) continue;

    const fetched: { c: Candidate; bytes: Uint8Array; sha256: string; ext: string }[] = [];
    for (const c of candidates) {
      try {
        const res = await fetch(c.downloadUrl, { headers: { 'User-Agent': USER_AGENT } });
        if (!res.ok) continue;
        const ext = extensionForType(res.headers.get('content-type'));
        if (!ext) continue;
        const declared = Number(res.headers.get('content-length') ?? 0);
        if (declared > MAX_DOWNLOAD_BYTES) continue;
        const bytes = new Uint8Array(await res.arrayBuffer());
        if (bytes.byteLength > MAX_DOWNLOAD_BYTES) continue;
        fetched.push({ c, bytes, sha256: sha256(bytes), ext });
      } catch {
        continue;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    const { kept } = dedupe(
      fetched.map((f) => ({
        ...f,
        id: f.sha256,
        width: f.c.width,
        height: f.c.height,
        author: f.c.author,
        title: f.c.title,
      })),
    );
    for (const k of kept) {
      if (manifest.assets.some((a) => a.sha256 === k.sha256)) continue;
      const ext = k.ext;
      const rel = `images/${job.category}/${k.c.provider}-${k.sha256.slice(0, 6)}${ext}`;
      mkdirSync(join(assetsDir, 'images', job.category), { recursive: true });
      writeFileSync(join(assetsDir, rel), k.bytes);
      manifest.assets.push(toEntry(k.c, job.category, rel, k.bytes, now));
      added++;
    }
  }

  if (args.dryRun) {
    console.log('[dry-run] nothing written');
    return;
  }
  manifest.generatedAt = now;
  saveManifest(manifestPath, manifest);
  writeCredits(join(root, 'CREDITS.md'), manifest);
  console.log(
    `added ${added} pending asset(s). Review and set status to approved. (sharp optimize skipped)`,
  );
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  collect(parseArgs(process.argv.slice(2)), process.cwd()).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { collect };
