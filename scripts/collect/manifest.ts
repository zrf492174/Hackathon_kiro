import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { isAllowedLicense, requiresAttribution } from './license';

export type AssetStatus = 'approved' | 'pending' | 'rejected';
export type AssetType = 'image' | 'audio';

export interface AssetSource {
  provider: string;
  pageUrl: string;
  downloadUrl: string;
  fetchedAt: string;
}

export interface ManifestAsset {
  id: string;
  type: AssetType;
  category: string;
  file: string;
  thumb?: string;
  width?: number;
  height?: number;
  bytes: number;
  hasAlpha?: boolean;
  sha256: string;
  phash?: string;
  source: AssetSource;
  author: string;
  authorUrl?: string;
  title: string;
  license: string;
  licenseUrl: string;
  attributionRequired: boolean;
  modified: boolean;
  tags: string[];
  status: AssetStatus;
  durationSec?: number;
  loop?: boolean;
  loudnessLufs?: number;
}

export interface Manifest {
  version: 1;
  generatedAt: string;
  assets: ManifestAsset[];
}

export const STATUSES: AssetStatus[] = ['approved', 'pending', 'rejected'];

export function emptyManifest(): Manifest {
  return { version: 1, generatedAt: new Date().toISOString(), assets: [] };
}

export function loadManifest(path: string): Manifest {
  if (!existsSync(path)) return emptyManifest();
  return JSON.parse(readFileSync(path, 'utf8')) as Manifest;
}

export function saveManifest(path: string, manifest: Manifest): void {
  mkdirSync(dirname(path), { recursive: true });
  const sorted = [...manifest.assets].sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(path, JSON.stringify({ ...manifest, assets: sorted }, null, 2) + '\n');
}

/** Insert or replace by id, or by sha256 when the same bytes already exist. */
export function upsertAsset(manifest: Manifest, asset: ManifestAsset): void {
  const i = manifest.assets.findIndex((a) => a.id === asset.id || a.sha256 === asset.sha256);
  if (i === -1) manifest.assets.push(asset);
  else manifest.assets[i] = asset;
}

/** Return a list of human readable problems with a manifest record (schema + license rules). */
export function validateAsset(a: ManifestAsset): string[] {
  const errs: string[] = [];
  const need = (ok: boolean, msg: string) => {
    if (!ok) errs.push(`${a.id ?? '?'}: ${msg}`);
  };
  need(typeof a.id === 'string' && a.id.length > 0, 'missing id');
  need(a.type === 'image' || a.type === 'audio', 'invalid type');
  need(!!a.category, 'missing category');
  need(!!a.file, 'missing file');
  need(!!a.sha256, 'missing sha256');
  need(!!a.source?.pageUrl && !!a.source?.provider, 'missing source');
  need(STATUSES.includes(a.status), `invalid status ${String(a.status)}`);
  need(isAllowedLicense(a.license), `license not whitelisted: ${String(a.license)}`);
  need(!!a.licenseUrl, 'missing licenseUrl');
  if (isAllowedLicense(a.license) && requiresAttribution(a.license)) {
    need(a.attributionRequired === true, 'attributionRequired must be true for CC BY');
    need(!!a.author && a.author.trim().length > 0, 'attribution required but author missing');
  }
  return errs;
}
