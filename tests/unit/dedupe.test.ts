import { describe, expect, it } from 'vitest';
import { averageHash, dedupe, hamming, sha256 } from '../../scripts/collect/dedupe';

describe('dedupe', () => {
  it('sha256 is stable', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('hamming distance', () => {
    expect(hamming('00', '00')).toBe(0);
    expect(hamming('0f', 'f0')).toBe(8);
    expect(hamming('0', '00')).toBe(Infinity);
  });
  it('drops exact duplicates and keeps higher resolution for near duplicates', () => {
    const items = [
      { id: 'a', sha256: '1', phash: '0000000000000000', width: 100, height: 100 },
      { id: 'b', sha256: '1', width: 100, height: 100 },
      { id: 'c', sha256: '2', phash: '0000000000000003', width: 500, height: 500 },
      { id: 'd', sha256: '3', phash: 'ffffffffffffffff', width: 10, height: 10 },
    ];
    const { kept, dropped } = dedupe(items);
    expect(kept.map((k) => k.id)).toEqual(['c', 'd']);
    expect(dropped.map((k) => k.id).sort()).toEqual(['a', 'b']);
  });
  it('merges same author and title across sources', () => {
    const { kept } = dedupe([
      { id: 'x', sha256: '1', author: 'A', title: 'T', width: 1, height: 1 },
      { id: 'y', sha256: '2', author: 'A', title: 'T', width: 2, height: 2 },
    ]);
    expect(kept.map((k) => k.id)).toEqual(['y']);
  });
  it('averageHash gives 16 hex chars', () => {
    const g = Array.from({ length: 64 }, (_, i) => (i < 32 ? 0 : 255));
    expect(averageHash(g)).toBe('00000000ffffffff');
  });
});
