import type { Composition } from '../../domain/music/types';
import { createStudioStore } from './studioStore';

const initialComposition: Composition = {
  id: 'studio-draft',
  title: '八小节草稿',
  bpm: 90,
  key: 'C-major',
  bars: 8,
  tracks: { drums: [], bass: [], chords: [], melody: [] },
};

describe('studioStore', () => {
  it('adds, moves, resizes, and removes notes while quantizing edits to quarter beats', () => {
    const store = createStudioStore(initialComposition);

    store.getState().addNote('melody', {
      midi: 64,
      startBeat: 0.13,
      durationBeats: 0.62,
      velocity: 0.8,
    });
    const note = store.getState().composition.tracks.melody[0];
    expect(note).toMatchObject({ midi: 64, startBeat: 0.25, durationBeats: 0.5 });

    store.getState().moveNote('melody', note.id, { startBeat: 1.13, midi: 67 });
    expect(store.getState().composition.tracks.melody[0]).toMatchObject({ startBeat: 1.25, midi: 67 });

    store.getState().resizeNote('melody', note.id, 1.13);
    expect(store.getState().composition.tracks.melody[0].durationBeats).toBe(1.25);

    store.getState().removeNote('melody', note.id);
    expect(store.getState().composition.tracks.melody).toEqual([]);
  });

  it('keeps every note inside the 0–32 beat canvas', () => {
    const store = createStudioStore(initialComposition);

    store.getState().addNote('bass', {
      midi: 48,
      startBeat: -4,
      durationBeats: 40,
      velocity: 0.8,
    });
    const note = store.getState().composition.tracks.bass[0];
    expect(note).toMatchObject({ startBeat: 0, durationBeats: 32 });

    store.getState().moveNote('bass', note.id, { startBeat: 31.9, midi: 48 });
    expect(store.getState().composition.tracks.bass[0]).toMatchObject({ startBeat: 31.75, durationBeats: 0.25 });

    store.getState().resizeNote('bass', note.id, 3);
    expect(store.getState().composition.tracks.bass[0].durationBeats).toBe(0.25);
  });

  it('undoes and redoes edit history and clears redo after a divergent edit', () => {
    const store = createStudioStore(initialComposition);
    store.getState().addNote('drums', { midi: 36, startBeat: 0, durationBeats: 0.25, velocity: 0.9 });
    expect(store.getState().canUndo).toBe(true);

    store.getState().undo();
    expect(store.getState().composition.tracks.drums).toEqual([]);
    expect(store.getState().canRedo).toBe(true);

    store.getState().redo();
    expect(store.getState().composition.tracks.drums).toHaveLength(1);

    store.getState().undo();
    store.getState().addNote('drums', { midi: 38, startBeat: 1, durationBeats: 0.25, velocity: 0.9 });
    expect(store.getState().canRedo).toBe(false);
  });

  it('changes BPM and key through undoable constrained controls', () => {
    const store = createStudioStore(initialComposition);

    store.getState().setBpm(128);
    store.getState().setKey('A-minor');
    expect(store.getState().composition).toMatchObject({ bpm: 128, key: 'A-minor' });

    store.getState().undo();
    expect(store.getState().composition.key).toBe('C-major');
    store.getState().undo();
    expect(store.getState().composition.bpm).toBe(90);
  });

  it('tracks selected notes, the focused track, and the playhead without adding history', () => {
    const store = createStudioStore(initialComposition);

    store.getState().selectNote('melody', 'note-1');
    store.getState().focusAt('chords', 7.13);
    store.getState().setPlayhead(40);

    expect(store.getState()).toMatchObject({
      selectedTrack: 'chords',
      selectedNoteId: null,
      focusedBeat: 7.25,
      playheadBeat: 32,
      canUndo: false,
    });
  });
});
