import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Composition, NoteEvent, TrackKind } from '../../domain/music/types';

export const STUDIO_BEATS = 32;
export const BEAT_STEP = 0.25;
export const STUDIO_BPMS = [70, 90, 110, 128] as const;
export type StudioBpm = (typeof STUDIO_BPMS)[number];

type CompositionKey = Composition['key'];
type NoteDraft = Omit<NoteEvent, 'id'>;

export type StudioState = {
  composition: Composition;
  selectedTrack: TrackKind;
  selectedNoteId: string | null;
  focusedBeat: number;
  playheadBeat: number;
  canUndo: boolean;
  canRedo: boolean;
  addNote(track: TrackKind, event: NoteDraft): void;
  moveNote(track: TrackKind, id: string, patch: Pick<NoteEvent, 'midi' | 'startBeat'>): void;
  resizeNote(track: TrackKind, id: string, durationBeats: number): void;
  removeNote(track: TrackKind, id: string): void;
  setBpm(bpm: StudioBpm): void;
  setKey(key: CompositionKey): void;
  replaceComposition(composition: Composition): void;
  selectNote(track: TrackKind, id: string | null): void;
  setSelectedTrack(track: TrackKind): void;
  focusAt(track: TrackKind, beat: number): void;
  setPlayhead(beat: number): void;
  undo(): void;
  redo(): void;
};

const cloneComposition = (composition: Composition): Composition => structuredClone(composition);
const quantize = (beat: number): number => Math.round(beat / BEAT_STEP) * BEAT_STEP;
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const clampStart = (beat: number): number => clamp(quantize(beat), 0, STUDIO_BEATS - BEAT_STEP);
const clampDuration = (duration: number, startBeat: number): number =>
  clamp(quantize(duration), BEAT_STEP, STUDIO_BEATS - startBeat);

const createEventId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `studio-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function createStudioStore(initialComposition: Composition): StoreApi<StudioState> {
  const past: Composition[] = [];
  const future: Composition[] = [];

  return createStore<StudioState>((set, get) => {
    const commit = (mutate: (draft: Composition) => void) => {
      const current = get().composition;
      const next = cloneComposition(current);
      mutate(next);
      past.push(cloneComposition(current));
      future.length = 0;
      set({ composition: next, canUndo: true, canRedo: false });
    };

    return {
      composition: cloneComposition(initialComposition),
      selectedTrack: 'drums',
      selectedNoteId: null,
      focusedBeat: 0,
      playheadBeat: 0,
      canUndo: false,
      canRedo: false,

      addNote(track, event) {
        commit((draft) => {
          const startBeat = clampStart(event.startBeat);
          draft.tracks[track].push({
            ...event,
            id: createEventId(),
            startBeat,
            durationBeats: clampDuration(event.durationBeats, startBeat),
          });
        });
      },

      moveNote(track, id, patch) {
        commit((draft) => {
          const event = draft.tracks[track].find((candidate) => candidate.id === id);
          if (!event) return;
          event.startBeat = clampStart(patch.startBeat);
          event.durationBeats = clampDuration(event.durationBeats, event.startBeat);
          event.midi = Math.round(patch.midi);
        });
      },

      resizeNote(track, id, durationBeats) {
        commit((draft) => {
          const event = draft.tracks[track].find((candidate) => candidate.id === id);
          if (event) event.durationBeats = clampDuration(durationBeats, event.startBeat);
        });
      },

      removeNote(track, id) {
        commit((draft) => {
          draft.tracks[track] = draft.tracks[track].filter((event) => event.id !== id);
        });
        if (get().selectedNoteId === id) set({ selectedNoteId: null });
      },

      setBpm(bpm) {
        commit((draft) => { draft.bpm = bpm; });
      },

      setKey(key) {
        commit((draft) => { draft.key = key; });
      },

      replaceComposition(composition) {
        past.length = 0;
        future.length = 0;
        set({ composition: cloneComposition(composition), selectedNoteId: null, canUndo: false, canRedo: false });
      },

      selectNote(track, id) {
        set({ selectedTrack: track, selectedNoteId: id });
      },

      setSelectedTrack(track) {
        set({ selectedTrack: track, selectedNoteId: null });
      },

      focusAt(track, beat) {
        set({ selectedTrack: track, selectedNoteId: null, focusedBeat: clamp(quantize(beat), 0, STUDIO_BEATS) });
      },

      setPlayhead(beat) {
        set({ playheadBeat: clamp(quantize(beat), 0, STUDIO_BEATS) });
      },

      undo() {
        const previous = past.pop();
        if (!previous) return;
        future.push(cloneComposition(get().composition));
        set({
          composition: previous,
          selectedNoteId: null,
          canUndo: past.length > 0,
          canRedo: true,
        });
      },

      redo() {
        const next = future.pop();
        if (!next) return;
        past.push(cloneComposition(get().composition));
        set({
          composition: next,
          selectedNoteId: null,
          canUndo: true,
          canRedo: future.length > 0,
        });
      },
    };
  });
}
