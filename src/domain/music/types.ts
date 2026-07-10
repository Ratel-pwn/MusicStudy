export type NoteName =
  | 'C'
  | 'C#'
  | 'Db'
  | 'D'
  | 'D#'
  | 'Eb'
  | 'E'
  | 'F'
  | 'F#'
  | 'Gb'
  | 'G'
  | 'G#'
  | 'Ab'
  | 'A'
  | 'A#'
  | 'Bb'
  | 'B';

export type Pitch = { note: NoteName; octave: number; midi: number };
export type ScaleKind = 'major' | 'naturalMinor';
export type TriadQuality = 'major' | 'minor' | 'diminished';
export type NoteEvent = {
  id: string;
  midi: number;
  startBeat: number;
  durationBeats: number;
  velocity: number;
};
export type TrackKind = 'drums' | 'bass' | 'chords' | 'melody';
export type Composition = {
  id: string;
  title: string;
  bpm: number;
  key: 'C-major' | 'A-minor';
  bars: 8;
  tracks: Record<TrackKind, NoteEvent[]>;
};
export type CompositionIssue = {
  code: string;
  track?: TrackKind;
  beat?: number;
  message: string;
};
