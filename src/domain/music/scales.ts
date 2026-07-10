import { pitchClass } from './pitch';
import type { NoteName, ScaleKind } from './types';

const SHARP_PITCH_CLASSES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_PITCH_CLASSES: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const SCALE_INTERVALS: Record<ScaleKind, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
};

export function notesAtIntervals(root: NoteName, intervals: number[]): NoteName[] {
  const pitchClasses = root.includes('b') ? FLAT_PITCH_CLASSES : SHARP_PITCH_CLASSES;
  const rootPitchClass = pitchClass(root);

  return intervals.map((interval) => pitchClasses[(rootPitchClass + interval) % 12]);
}

export function buildScale(root: NoteName, kind: ScaleKind): NoteName[] {
  return notesAtIntervals(root, SCALE_INTERVALS[kind]);
}
