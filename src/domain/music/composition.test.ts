import { describe, expect, it } from 'vitest';

import { evaluateComposition } from './composition';
import type { Composition, NoteEvent, TrackKind } from './types';

const note = (
  id: string,
  midi: number,
  startBeat: number,
  durationBeats = 1,
  velocity = 96,
): NoteEvent => ({ id, midi, startBeat, durationBeats, velocity });

const validComposition = (): Composition => ({
  id: 'composition-1',
  title: 'Eight-bar study',
  bpm: 100,
  key: 'C-major',
  bars: 8,
  tracks: {
    drums: [note('drums-1', 36, 0)],
    bass: [note('bass-1', 36, 0)],
    chords: [note('chords-1', 48, 0, 32), note('chords-2', 52, 0, 32), note('chords-3', 55, 0, 32)],
    melody: [note('melody-1', 60, 0), note('melody-2', 64, 2), note('melody-3', 72, 31)],
  },
});

describe('evaluateComposition', () => {
  it('reports every empty required track', () => {
    const composition = validComposition();
    composition.tracks = { drums: [], bass: [], chords: [], melody: [] };

    expect(evaluateComposition(composition)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'missing-drums' }),
        expect.objectContaining({ code: 'missing-bass' }),
        expect.objectContaining({ code: 'missing-chords' }),
        expect.objectContaining({ code: 'missing-melody' }),
      ]),
    );
  });

  it('reports events outside the eight-bar boundary', () => {
    const composition = validComposition();
    composition.tracks.bass = [note('bass-outside', 36, 31.5, 1)];

    expect(evaluateComposition(composition)).toContainEqual(
      expect.objectContaining({ code: 'event-out-of-bounds', track: 'bass', beat: 31.5 }),
    );
  });

  it.each([69, 129, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'reports BPM %s outside the supported 70–128 range',
    (bpm) => {
      const composition = validComposition();
      composition.bpm = bpm;

      expect(evaluateComposition(composition)).toContainEqual(
        expect.objectContaining({ code: 'tempo-out-of-range' }),
      );
    },
  );

  it.each([70, 128])('accepts boundary BPM %i', (bpm) => {
    const composition = validComposition();
    composition.bpm = bpm;

    expect(evaluateComposition(composition)).not.toContainEqual(
      expect.objectContaining({ code: 'tempo-out-of-range' }),
    );
  });

  it('reports a melody range wider than 19 semitones', () => {
    const composition = validComposition();
    composition.tracks.melody = [note('melody-low', 60, 0), note('melody-high', 80, 31)];

    expect(evaluateComposition(composition)).toContainEqual(
      expect.objectContaining({ code: 'melody-range-too-wide', track: 'melody' }),
    );
  });

  it('reports when fewer than half of strong-beat melody notes are chord tones', () => {
    const composition = validComposition();
    composition.tracks.melody = [
      note('melody-1', 62, 0),
      note('melody-2', 65, 2),
      note('melody-3', 72, 31),
    ];

    expect(evaluateComposition(composition)).toContainEqual(
      expect.objectContaining({ code: 'low-strong-beat-chord-tone-ratio', track: 'melody' }),
    );
  });

  it('reports a melody that does not finish on the tonic', () => {
    const composition = validComposition();
    composition.tracks.melody[2] = note('melody-3', 71, 31);

    expect(evaluateComposition(composition)).toContainEqual(
      expect.objectContaining({ code: 'missing-tonic-resolution', track: 'melody', beat: 31 }),
    );
  });

  it('accepts a composition that satisfies every rule', () => {
    expect(evaluateComposition(validComposition())).toHaveLength(0);
  });

  it('attributes each event issue to its track', () => {
    const composition = validComposition();
    const track: TrackKind = 'drums';
    composition.tracks[track] = [note('drums-negative', 36, -0.25)];

    expect(evaluateComposition(composition)).toContainEqual(
      expect.objectContaining({ code: 'event-out-of-bounds', track, beat: -0.25 }),
    );
  });
});
