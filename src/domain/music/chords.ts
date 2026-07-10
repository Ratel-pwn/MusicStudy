import type { NoteName, TriadQuality } from './types';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const NATURAL_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11] as const;
const NOTE_NAMES = new Set<NoteName>([
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
]);
const FALLBACK_PITCH_CLASSES: NoteName[] = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const TRIAD_INTERVALS: Record<TriadQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
};

function rootPitchClass(root: NoteName): number {
  const letterIndex = LETTERS.indexOf(root[0] as (typeof LETTERS)[number]);
  const accidental = root[1] === '#' ? 1 : root[1] === 'b' ? -1 : 0;
  return (NATURAL_PITCH_CLASSES[letterIndex] + accidental + 12) % 12;
}

function spellTriad(root: NoteName, intervals: number[]): NoteName[] {
  const rootLetterIndex = LETTERS.indexOf(root[0] as (typeof LETTERS)[number]);
  const rootPitch = rootPitchClass(root);

  return intervals.map((interval, triadIndex) => {
    const letterIndex = (rootLetterIndex + triadIndex * 2) % LETTERS.length;
    const letter = LETTERS[letterIndex];
    const targetPitch = (rootPitch + interval) % 12;
    const naturalPitch = NATURAL_PITCH_CLASSES[letterIndex];
    const difference = (targetPitch - naturalPitch + 12) % 12;
    const accidental = difference === 0 ? '' : difference === 1 ? '#' : difference === 11 ? 'b' : undefined;
    const candidate = accidental === undefined ? undefined : `${letter}${accidental}`;

    return candidate !== undefined && NOTE_NAMES.has(candidate as NoteName)
      ? (candidate as NoteName)
      : FALLBACK_PITCH_CLASSES[targetPitch];
  });
}

export function buildTriad(root: NoteName, quality: TriadQuality): NoteName[] {
  return spellTriad(root, TRIAD_INTERVALS[quality]);
}
