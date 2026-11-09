import { createHash } from 'node:crypto';

export function sha256(data: Uint8Array | string): string {
  return createHash('sha256').update(data).digest('hex');
}

/** Hamming distance between two hex hashes of equal length. Infinity if lengths differ. */
export function hamming(a: string, b: string): number {
  if (a.length !== b.length) return Infinity;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      dist += x & 1;
      x >>= 1;
    }
  }
  return dist;
}

export interface DedupeItem {
  id: string;
  sha256: string;
  phash?: string;
  width?: number;
  height?: number;
  author?: string;
  title?: string;
}

export const PHASH_THRESHOLD = 6;

function area(i: DedupeItem): number {
  return (i.width ?? 0) * (i.height ?? 0);
}

function sameWork(a: DedupeItem, b: DedupeItem): boolean {
  if (a.sha256 === b.sha256) return true;
  if (a.phash && b.phash && hamming(a.phash, b.phash) <= PHASH_THRESHOLD) return true;
  if (a.author && a.title && a.author === b.author && a.title === b.title) return true;
  return false;
}

/** Keep the highest resolution item of each duplicate group. Order of first appearance is kept. */
export function dedupe<T extends DedupeItem>(items: T[]): { kept: T[]; dropped: T[] } {
  const kept: T[] = [];
  const dropped: T[] = [];
  for (const item of items) {
    const idx = kept.findIndex((k) => sameWork(k, item));
    if (idx === -1) {
      kept.push(item);
    } else if (area(item) > area(kept[idx])) {
      dropped.push(kept[idx]);
      kept[idx] = item;
    } else {
      dropped.push(item);
    }
  }
  return { kept, dropped };
}

/** Simple average hash over a grayscale 8x8 grid (64 values) producing 16 hex chars. */
export function averageHash(gray64: ArrayLike<number>): string {
  let sum = 0;
  for (let i = 0; i < 64; i++) sum += gray64[i];
  const avg = sum / 64;
  let out = '';
  for (let n = 0; n < 16; n++) {
    let nibble = 0;
    for (let b = 0; b < 4; b++) nibble = (nibble << 1) | (gray64[n * 4 + b] >= avg ? 1 : 0);
    out += nibble.toString(16);
  }
  return out;
}
