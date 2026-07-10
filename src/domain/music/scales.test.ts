import { describe, expect, it } from 'vitest';

import { buildScale } from './scales';

describe('buildScale', () => {
  it('builds a C major scale', () => {
    expect(buildScale('C', 'major')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });
});
