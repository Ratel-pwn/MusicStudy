import { describe, expect, it } from 'vitest';

import { buildTriad } from './chords';

describe('buildTriad', () => {
  it('builds a B diminished triad', () => {
    expect(buildTriad('B', 'diminished')).toEqual(['B', 'D', 'F']);
  });

  it('spells a C minor triad with a flat third', () => {
    expect(buildTriad('C', 'minor')).toEqual(['C', 'Eb', 'G']);
  });

  it('falls back to an equivalent pitch when a chord tone needs an unsupported accidental', () => {
    expect(buildTriad('D#', 'major')).toEqual(['D#', 'G', 'A#']);
  });
});
