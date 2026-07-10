import { notesAtIntervals } from './scales';
import type { NoteName, TriadQuality } from './types';

const TRIAD_INTERVALS: Record<TriadQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
};

export function buildTriad(root: NoteName, quality: TriadQuality): NoteName[] {
  return notesAtIntervals(root, TRIAD_INTERVALS[quality]);
}
