import type { NoteName, Pitch } from './types';

const PITCH_CLASSES: Record<NoteName, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

function pitchClass(note: NoteName): number {
  return PITCH_CLASSES[note];
}

export function parseNote(value: string): Pitch {
  const match = /^(C#|Db|D#|Eb|F#|Gb|G#|Ab|A#|Bb|[CDEFGAB])(-?\d+)$/.exec(value);

  if (!match) {
    throw new Error(`Invalid note: ${value}`);
  }

  const note = match[1] as NoteName;
  const octave = Number(match[2]);

  return {
    note,
    octave,
    midi: (octave + 1) * 12 + pitchClass(note),
  };
}

export function intervalSemitones(from: string, to: string): number {
  return parseNote(to).midi - parseNote(from).midi;
}
