import { describe, expect, it } from 'vitest';

import { intervalSemitones, parseNote } from './pitch';

describe('pitch', () => {
  it('parses middle C as MIDI note 60', () => {
    expect(parseNote('C4').midi).toBe(60);
  });

  it('measures the semitone distance between notes', () => {
    expect(intervalSemitones('C4', 'Eb4')).toBe(3);
  });
});
