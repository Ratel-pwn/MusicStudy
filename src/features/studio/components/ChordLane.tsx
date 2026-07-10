import { useState, type DragEvent } from 'react';
import { useStore } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';
import type { StudioState } from '../studioStore';

const CHORDS = {
  C: 60,
  F: 65,
  G: 67,
  Am: 69,
} as const;
type ChordName = keyof typeof CHORDS;

export function ChordLane({ store }: { store: StoreApi<StudioState> }) {
  const [armedChord, setArmedChord] = useState<ChordName>('C');
  const events = useStore(store, (state) => state.composition.tracks.chords);
  const addNote = useStore(store, (state) => state.addNote);
  const removeNote = useStore(store, (state) => state.removeNote);

  const placeChord = (name: ChordName, bar: number) => {
    const startBeat = bar * 4;
    events.filter((event) => event.startBeat === startBeat).forEach((event) => removeNote('chords', event.id));
    addNote('chords', { midi: CHORDS[name], startBeat, durationBeats: 4, velocity: 0.72 });
  };

  const readChord = (event: DragEvent): ChordName => {
    const value = event.dataTransfer.getData('text/plain');
    return value in CHORDS ? value as ChordName : armedChord;
  };

  return (
    <div className="chord-editor">
      <div className="chord-palette" aria-label="和弦片段">
        {(Object.keys(CHORDS) as ChordName[]).map((name) => (
          <button
            aria-label={`${name} 和弦片段`}
            aria-pressed={armedChord === name}
            draggable
            key={name}
            onClick={() => setArmedChord(name)}
            onDragStart={(event) => event.dataTransfer.setData('text/plain', name)}
            type="button"
          >
            {name}
          </button>
        ))}
      </div>
      <div className="chord-lane">
        {Array.from({ length: 8 }, (_, bar) => {
          const event = events.find((candidate) => candidate.startBeat === bar * 4);
          const chord = event && (Object.entries(CHORDS).find(([, midi]) => midi === event.midi)?.[0] ?? '—');
          return (
            <button
              aria-label={`第 ${bar + 1} 小节和弦区`}
              className="chord-slot"
              key={bar}
              onClick={() => placeChord(armedChord, bar)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); placeChord(readChord(event), bar); }}
              type="button"
            >
              <span>{chord || '放入和弦'}</span>
              <small>{bar * 4 + 1}–{bar * 4 + 4} 拍</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
