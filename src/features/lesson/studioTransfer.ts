import { compositionRepository } from '../../data/repositories';
import { parseNote } from '../../domain/music/pitch';
import type { Composition, NoteEvent, TrackKind } from '../../domain/music/types';
import type { LessonStep } from '../../content/schema';

const emptyComposition = (): Composition => ({
  id: 'lesson-draft',
  title: '课程迁移练习',
  bpm: 90,
  key: 'C-major',
  bars: 8,
  tracks: { drums: [], bass: [], chords: [], melody: [] },
});

const event = (midi: number, startBeat: number, durationBeats = 1): NoteEvent => ({
  id: globalThis.crypto.randomUUID(), midi, startBeat, durationBeats, velocity: .8,
});

function melodyMaterial(step: LessonStep): string[] {
  const config = step.config;
  if (Array.isArray(config.sequence)) return config.sequence as string[];
  if (Array.isArray(config.palette)) return config.palette as string[];
  if (Array.isArray(config.source)) {
    const source = [...config.source] as string[];
    if (typeof config.ending === 'string') source[source.length - 1] = config.ending;
    return source;
  }
  return ['C4', 'G4', 'C4'];
}

function writeTrack(composition: Composition, track: TrackKind, step: LessonStep): void {
  const config = step.config;
  if (track === 'drums') {
    const startBar = typeof config.bar === 'number' ? config.bar - 1 : 0;
    const bars = typeof config.bars === 'number' ? config.bars : 1;
    const subdivision = step.id.includes('eighth') ? .5 : 1;
    for (let beat = startBar * 4; beat < Math.min(32, (startBar + bars) * 4); beat += subdivision) {
      composition.tracks.drums.push(event(beat % 4 === 0 ? 36 : 42, beat, .25));
    }
    return;
  }
  if (track === 'chords') {
    const notes = Array.isArray(config.notes) ? config.notes as string[] : ['C3', 'E3', 'G3'];
    const startBeat = (typeof config.bar === 'number' ? config.bar - 1 : 0) * 4;
    composition.tracks.chords.push(...notes.map((note) => event(parseNote(note).midi, startBeat, 4)));
    return;
  }
  const notes = melodyMaterial(step);
  composition.tracks[track].push(...notes.map((note, index) => event(parseNote(note).midi, index, 1)));
}

export async function applyStudioTransfer(step: LessonStep) {
  const composition = structuredClone((await compositionRepository.recent()) ?? emptyComposition());
  const tracks = (Array.isArray(step.config.requiredTracks)
    ? step.config.requiredTracks
    : [step.config.targetTrack ?? 'melody']) as TrackKind[];
  tracks.forEach((track) => writeTrack(composition, track, step));
  if (Array.isArray(step.config.requiredTracks)) {
    composition.tracks.melody.push(event(60, 28, 4));
  }
  await compositionRepository.save(composition);
  return { applied: true as const, compositionId: composition.id, trackActions: tracks };
}
