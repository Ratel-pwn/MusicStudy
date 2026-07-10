type RhythmValue = 'whole' | 'half' | 'quarter' | 'eighth';

const BEATS_PER_VALUE: Record<RhythmValue, number> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
};

export function measureBeats(items: Array<{ value: RhythmValue; count: number }>): number {
  return items.reduce((total, item) => total + BEATS_PER_VALUE[item.value] * item.count, 0);
}

export function quantizeBeat(beat: number, subdivision: 0.25 | 0.5 | 1): number {
  return Math.round(beat / subdivision) * subdivision;
}
