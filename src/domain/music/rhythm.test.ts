import { describe, expect, it } from 'vitest';

import { measureBeats, quantizeBeat } from './rhythm';

describe('rhythm', () => {
  it('measures the total beats in rhythm items', () => {
    expect(measureBeats([{ value: 'quarter', count: 4 }])).toBe(4);
  });

  it('quantizes a beat to the nearest subdivision', () => {
    expect(quantizeBeat(1.37, 0.25)).toBe(1.25);
  });
});
