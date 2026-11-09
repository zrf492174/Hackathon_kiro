import { describe, expect, it } from 'vitest';
import { isAllowedLicense, normalizeLicense } from '../../scripts/collect/license';

describe('normalizeLicense', () => {
  it('maps whitelisted licenses', () => {
    expect(normalizeLicense('cc0', '1.0')).toBe('CC0-1.0');
    expect(normalizeLicense('pdm')).toBe('PDM');
    expect(normalizeLicense('Public domain')).toBe('PDM');
    expect(normalizeLicense('by', '4.0')).toBe('CC-BY-4.0');
    expect(normalizeLicense('CC BY 3.0')).toBe('CC-BY-3.0');
  });
  it('rejects NC, ND, SA, unknown and empty', () => {
    for (const l of [
      'by-nc',
      'by-nd',
      'by-sa',
      'CC BY-SA 4.0',
      'All rights reserved',
      '',
      null,
      undefined,
    ]) {
      expect(normalizeLicense(l as string, '4.0')).toBeNull();
    }
    expect(normalizeLicense('by', '2.0')).toBeNull();
  });
  it('isAllowedLicense checks whitelist', () => {
    expect(isAllowedLicense('CC0-1.0')).toBe(true);
    expect(isAllowedLicense('CC-BY-NC-4.0')).toBe(false);
  });
});
