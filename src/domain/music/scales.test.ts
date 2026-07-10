import { describe, expect, it } from 'vitest';

import { buildScale } from './scales';

describe('buildScale', () => {
  it('builds a C major scale', () => {
    expect(buildScale('C', 'major')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });

  it('spells a C natural minor scale with the correct flat scale degrees', () => {
    expect(buildScale('C', 'naturalMinor')).toEqual(['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb']);
  });

  it('builds an A natural minor scale without accidentals', () => {
    expect(buildScale('A', 'naturalMinor')).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  });

  it('falls back to an equivalent pitch when a scale degree needs an unsupported accidental', () => {
    expect(buildScale('D#', 'major')).toEqual(['D#', 'F', 'G', 'G#', 'A#', 'C', 'D']);
  });
});
