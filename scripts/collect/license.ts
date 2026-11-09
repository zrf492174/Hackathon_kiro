export const LICENSE_WHITELIST = [
  'CC0-1.0',
  'PDM',
  'CC-BY-4.0',
  'CC-BY-3.0',
  'PIXABAY',
  'UNSPLASH',
] as const;

export type License = (typeof LICENSE_WHITELIST)[number];

const URLS: Record<License, string> = {
  'CC0-1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  PDM: 'https://creativecommons.org/publicdomain/mark/1.0/',
  'CC-BY-4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC-BY-3.0': 'https://creativecommons.org/licenses/by/3.0/',
  PIXABAY: 'https://pixabay.com/service/license-summary/',
  UNSPLASH: 'https://unsplash.com/license',
};

export function isAllowedLicense(value: unknown): value is License {
  return typeof value === 'string' && (LICENSE_WHITELIST as readonly string[]).includes(value);
}

export function licenseUrl(license: License): string {
  return URLS[license];
}

export function requiresAttribution(license: License): boolean {
  return license === 'CC-BY-4.0' || license === 'CC-BY-3.0';
}

/**
 * Normalize a provider license string to a whitelisted id, or null if unknown or disallowed.
 * Openverse gives (license, version) such as ("by", "4.0"). Wikimedia gives short names such as
 * "CC BY 4.0", "CC0", "Public domain". Anything with NC, ND or SA is rejected.
 */
export function normalizeLicense(
  raw: string | undefined | null,
  version?: string | null,
): License | null {
  if (!raw) return null;
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
  if (!s) return null;
  if (/(^|-)(nc|nd|sa)(-|$)/.test(s)) return null;
  if (s === 'cc0' || s === 'cc0-1.0' || s.startsWith('cc0-')) return 'CC0-1.0';
  if (s === 'pdm' || s === 'public-domain' || s === 'public-domain-mark') return 'PDM';
  if (s === 'pixabay' || s === 'pixabay-license') return 'PIXABAY';
  if (s === 'unsplash' || s === 'unsplash-license') return 'UNSPLASH';
  const m = /^(?:cc-)?by(?:-(\d\.\d))?$/.exec(s);
  if (m) {
    const v = m[1] ?? version ?? '';
    if (v === '4.0') return 'CC-BY-4.0';
    if (v === '3.0') return 'CC-BY-3.0';
    return null;
  }
  return null;
}
