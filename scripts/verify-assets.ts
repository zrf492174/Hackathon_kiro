import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from './collect/dedupe';
import { loadManifest, validateAsset } from './collect/manifest';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

/** Verify assets under assetsDir against its manifest.json. Returns a list of errors. */
/** Originals above this size need optimizing (sharp step is not implemented yet). */
export const MAX_ASSET_BYTES = 2 * 1024 * 1024;

export function verifyAssets(assetsDir: string): string[] {
  const manifestPath = join(assetsDir, 'manifest.json');
  if (!existsSync(manifestPath)) return ['manifest.json is missing'];
  const manifest = loadManifest(manifestPath);
  const errors: string[] = [];
  const known = new Set<string>();
  const ids = new Set<string>();

  for (const a of manifest.assets) {
    errors.push(...validateAsset(a));
    if (ids.has(a.id)) errors.push(`${a.id}: duplicate id`);
    ids.add(a.id);
    known.add(a.file);
    if (a.thumb) known.add(a.thumb);
    const full = join(assetsDir, a.file);
    if (!existsSync(full)) {
      errors.push(`${a.id}: file not found ${a.file}`);
    } else if (statSync(full).size > MAX_ASSET_BYTES) {
      errors.push(`${a.id}: ${a.file} exceeds ${MAX_ASSET_BYTES} bytes, optimize it first`);
    } else if (a.sha256 && sha256(readFileSync(full)) !== a.sha256) {
      errors.push(`${a.id}: sha256 mismatch for ${a.file}`);
    }
  }

  if (existsSync(assetsDir)) {
    for (const f of walk(assetsDir)) {
      const rel = relative(assetsDir, f).split(sep).join('/');
      if (rel === 'manifest.json') continue;
      if (!known.has(rel)) errors.push(`${rel}: file has no manifest record`);
    }
  }
  return errors;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const dir = resolve(process.cwd(), 'public/assets');
  const errors = verifyAssets(dir);
  if (errors.length) {
    console.error(`assets:verify failed with ${errors.length} problem(s):`);
    for (const e of errors) console.error(` - ${e}`);
    process.exit(1);
  }
  console.log('assets:verify ok');
}
