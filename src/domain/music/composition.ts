import type { Composition, CompositionIssue, NoteEvent, TrackKind } from './types';

const TRACKS: TrackKind[] = ['drums', 'bass', 'chords', 'melody'];
const BEATS_PER_BAR = 4;
const MIN_BPM = 70;
const MAX_BPM = 128;
const MAX_MELODY_RANGE = 19;
const MIN_STRONG_BEAT_CHORD_TONE_RATIO = 0.5;

const pitchClass = (midi: number): number => ((midi % 12) + 12) % 12;

const eventContainsBeat = (event: NoteEvent, beat: number): boolean =>
  event.startBeat <= beat && event.startBeat + event.durationBeats > beat;

const isStrongBeat = (beat: number): boolean => {
  const beatInBar = ((beat % BEATS_PER_BAR) + BEATS_PER_BAR) % BEATS_PER_BAR;
  return beatInBar === 0 || beatInBar === 2;
};

export function evaluateComposition(composition: Composition): CompositionIssue[] {
  const issues: CompositionIssue[] = [];
  const totalBeats = composition.bars * BEATS_PER_BAR;

  for (const track of TRACKS) {
    if (composition.tracks[track].length === 0) {
      issues.push({ code: `missing-${track}`, track, message: `${track} track needs at least one event.` });
    }
  }

  for (const track of TRACKS) {
    for (const event of composition.tracks[track]) {
      const eventEnd = event.startBeat + event.durationBeats;
      if (
        !Number.isFinite(event.startBeat) ||
        !Number.isFinite(event.durationBeats) ||
        event.startBeat < 0 ||
        event.durationBeats <= 0 ||
        eventEnd > totalBeats
      ) {
        issues.push({
          code: 'event-out-of-bounds',
          track,
          beat: event.startBeat,
          message: `Event ${event.id} must stay within the ${totalBeats}-beat composition.`,
        });
      }
    }
  }

  if (!Number.isFinite(composition.bpm) || composition.bpm < MIN_BPM || composition.bpm > MAX_BPM) {
    issues.push({
      code: 'tempo-out-of-range',
      message: `Tempo must be between ${MIN_BPM} and ${MAX_BPM} BPM.`,
    });
  }

  const melody = composition.tracks.melody;
  if (melody.length === 0) {
    return issues;
  }

  const melodyMidis = melody.map((event) => event.midi);
  if (Math.max(...melodyMidis) - Math.min(...melodyMidis) > MAX_MELODY_RANGE) {
    issues.push({
      code: 'melody-range-too-wide',
      track: 'melody',
      message: `Melody range must not exceed ${MAX_MELODY_RANGE} semitones.`,
    });
  }

  const strongBeatNotes = melody.filter((event) => isStrongBeat(event.startBeat));
  const chordToneCount = strongBeatNotes.filter((melodyEvent) =>
    composition.tracks.chords.some(
      (chordEvent) =>
        eventContainsBeat(chordEvent, melodyEvent.startBeat) &&
        pitchClass(chordEvent.midi) === pitchClass(melodyEvent.midi),
    ),
  ).length;
  const chordToneRatio = strongBeatNotes.length === 0 ? 0 : chordToneCount / strongBeatNotes.length;

  if (chordToneRatio < MIN_STRONG_BEAT_CHORD_TONE_RATIO) {
    issues.push({
      code: 'low-strong-beat-chord-tone-ratio',
      track: 'melody',
      message: 'At least half of strong-beat melody notes must be chord tones.',
    });
  }

  const finalNote = melody.reduce((latest, event) =>
    event.startBeat + event.durationBeats > latest.startBeat + latest.durationBeats ? event : latest,
  );
  const tonicPitchClass = composition.key === 'C-major' ? 0 : 9;

  if (pitchClass(finalNote.midi) !== tonicPitchClass) {
    issues.push({
      code: 'missing-tonic-resolution',
      track: 'melody',
      beat: finalNote.startBeat,
      message: 'The melody must finish on the tonic.',
    });
  }

  return issues;
}
