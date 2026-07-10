import { useStore } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';
import type { StudioState } from '../studioStore';

const DRUMS = [
  { name: '底鼓', midi: 36 },
  { name: '军鼓', midi: 38 },
  { name: '踩镲', midi: 42 },
] as const;

export function DrumSequencer({ store }: { store: StoreApi<StudioState> }) {
  const events = useStore(store, (state) => state.composition.tracks.drums);
  const addNote = useStore(store, (state) => state.addNote);
  const removeNote = useStore(store, (state) => state.removeNote);

  return (
    <div className="drum-grid" aria-label="鼓机音序器">
      {DRUMS.map((drum) => (
        <div className="drum-row" key={drum.midi}>
          <span className="drum-name">{drum.name}</span>
          <div className="beat-cells">
            {Array.from({ length: 32 }, (_, beat) => {
              const event = events.find((candidate) => candidate.midi === drum.midi && candidate.startBeat === beat);
              return (
                <button
                  aria-label={`${drum.name} 第 ${beat + 1} 拍`}
                  aria-pressed={Boolean(event)}
                  className="drum-cell"
                  key={beat}
                  onClick={() => event
                    ? removeNote('drums', event.id)
                    : addNote('drums', { midi: drum.midi, startBeat: beat, durationBeats: 0.25, velocity: 0.9 })}
                  type="button"
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
