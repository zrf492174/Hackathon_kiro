import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { sha256 } from './dedupe';
import { loadManifest, saveManifest, upsertAsset, type ManifestAsset } from './manifest';

const CATEGORY: Record<string, string> = {
  ghost: 'ghosts',
  'pumpkin-on': 'pumpkins',
  'pumpkin-off': 'pumpkins',
  bat: 'bats',
  cobweb: 'webs',
  spider: 'webs',
  tombstone: 'scenery',
  eyes: 'scenery',
  moon: 'scenery',
};

/** Register the bundled placeholder SVGs as approved CC0 entries. */
const root = process.cwd();
const dir = join(root, 'public/assets/placeholders');
const manifestPath = join(root, 'public/assets/manifest.json');
const manifest = loadManifest(manifestPath);
const now = new Date().toISOString();

for (const f of readdirSync(dir)
  .filter((n) => n.endsWith('.svg'))
  .sort()) {
  const name = f.replace(/\.svg$/, '');
  const bytes = readFileSync(join(dir, f));
  const existing = manifest.assets.find((a) => a.id === `placeholder-${name}`);
  const asset: ManifestAsset = {
    id: `placeholder-${name}`,
    type: 'image',
    category: CATEGORY[name] ?? 'scenery',
    file: `placeholders/${f}`,
    width: 100,
    height: 100,
    bytes: statSync(join(dir, f)).size,
    hasAlpha: true,
    sha256: sha256(bytes),
    source: {
      provider: 'self',
      pageUrl: 'https://github.com/zrf492174/Hackathon_kiro',
      downloadUrl: `placeholders/${f}`,
      fetchedAt: existing?.source.fetchedAt ?? now,
    },
    author: 'Haunted Hollow contributors',
    title: `Placeholder ${name}`,
    license: 'CC0-1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    attributionRequired: false,
    modified: false,
    tags: ['placeholder', name],
    status: 'approved',
  };
  upsertAsset(manifest, asset);
}
manifest.generatedAt = now;
saveManifest(manifestPath, manifest);
console.log('placeholder manifest entries written');
