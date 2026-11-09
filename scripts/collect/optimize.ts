export interface OptimizeResult {
  full: Uint8Array;
  thumb: Uint8Array;
  width: number;
  height: number;
}

export const MAX_EDGE = 1600;
export const THUMB_WIDTH = 320;

/** Converts to WebP (max edge 1600) plus a 320px thumbnail. Returns null if sharp is unavailable. */
export async function optimizeImage(input: Uint8Array): Promise<OptimizeResult | null> {
  let sharp: typeof import('sharp').default;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('optimize: sharp not installed, skipping');
    return null;
  }
  const base = sharp(input).rotate();
  const full = await base
    .clone()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });
  const thumb = await base
    .clone()
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();
  return {
    full: new Uint8Array(full.data),
    thumb: new Uint8Array(thumb),
    width: full.info.width,
    height: full.info.height,
  };
}
