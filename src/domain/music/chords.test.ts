import { describe, expect, it } from 'vitest';

import { buildTriad } from './chords';

describe('buildTriad', () => {
  it('builds a B diminished triad', () => {
    expect(buildTriad('B', 'diminished')).toEqual(['B', 'D', 'F']);
  });
});
