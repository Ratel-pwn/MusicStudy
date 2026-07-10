import { ArrowsOutLineHorizontal, Trash } from '@phosphor-icons/react';
import { useStore } from 'zustand';
import type { KeyboardEvent } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { TrackKind } from '../../../domain/music/types';
import type { StudioState } from '../studioStore';

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const pitchLabel = (midi: number) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
const TRACK_LABELS: Record<'bass' | 'melody', string> = { bass: '贝斯', melody: '旋律' };

type PianoRollProps = {
  store: StoreApi<StudioState>;
  track: Extract<TrackKind, 'bass' | 'melody'>;
};

export function PianoRoll({ store, track }: PianoRollProps) {
  const events = useStore(store, (state) => state.composition.tracks[track]);
  const selectedNoteId = useStore(store, (state) => state.selectedNoteId);
  const selectedTrack = useStore(store, (state) => state.selectedTrack);
  const selectNote = useStore(store, (state) => state.selectNote);
  const addNote = useStore(store, (state) => state.addNote);
  const moveNote = useStore(store, (state) => state.moveNote);
  const resizeNote = useStore(store, (state) => state.resizeNote);
  const removeNote = useStore(store, (state) => state.removeNote);
  const selected = selectedTrack === track ? events.find((event) => event.id === selectedNoteId) : undefined;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const note = events.find((candidate) => candidate.id === id);
    if (!note) return;
    const directions: Record<string, { midi: number; startBeat: number }> = {
      ArrowRight: { midi: note.midi, startBeat: note.startBeat + 0.25 },
      ArrowLeft: { midi: note.midi, startBeat: note.startBeat - 0.25 },
      ArrowUp: { midi: note.midi + 1, startBeat: note.startBeat },
      ArrowDown: { midi: note.midi - 1, startBeat: note.startBeat },
    };
    if (directions[event.key]) {
      event.preventDefault();
      moveNote(track, id, directions[event.key]);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      removeNote(track, id);
    }
  };

  return (
    <div className={`piano-roll piano-roll--${track}`} aria-label={`${TRACK_LABELS[track]}钢琴卷帘`}>
      <div className="pitch-ruler" aria-hidden="true">C5<br />C4<br />C3</div>
      <div className="piano-canvas">
        <div className="piano-add-grid">
          {Array.from({ length: 32 }, (_, beat) => (
            <button
              aria-label={`在第 ${beat + 1} 拍添加${TRACK_LABELS[track]}音符`}
              key={beat}
              onClick={() => addNote(track, {
                midi: track === 'bass' ? 48 : 60,
                startBeat: beat,
                durationBeats: 1,
                velocity: 0.8,
              })}
              type="button"
            />
          ))}
        </div>
        {events.map((note) => (
          <button
            aria-label={`${TRACK_LABELS[track]}音符 ${pitchLabel(note.midi)}，位于第 ${note.startBeat + 1} 拍`}
            aria-pressed={selectedNoteId === note.id && selectedTrack === track}
            className="piano-note"
            key={note.id}
            onClick={() => selectNote(track, note.id)}
            onKeyDown={(event) => handleKeyDown(event, note.id)}
            style={{
              left: `${(note.startBeat / 32) * 100}%`,
              width: `${Math.max((note.durationBeats / 32) * 100, 0.78)}%`,
              top: `${Math.max(4, Math.min(82, 82 - (note.midi - 36) * 2.1))}%`,
            }}
            type="button"
          >
            <span>{pitchLabel(note.midi)}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div aria-label="音符工具" className="note-tools" role="toolbar">
          <button onClick={() => resizeNote(track, selected.id, selected.durationBeats + 0.25)} type="button">
            <ArrowsOutLineHorizontal aria-hidden="true" /> 延长
          </button>
          <button onClick={() => removeNote(track, selected.id)} type="button">
            <Trash aria-hidden="true" /> 删除
          </button>
        </div>
      )}
    </div>
  );
}
