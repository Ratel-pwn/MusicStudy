import { useRef, type KeyboardEvent } from 'react';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

function keyForMidi(midi: number) {
  return {
    label: `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`,
    midi,
    black: BLACK_PITCH_CLASSES.has(midi % 12),
  };
}

type PianoKeyboardProps = {
  value: number[];
  midis?: number[];
  midiRange?: readonly [number, number];
  onChange(value: number[]): void;
  onPlay(midi: number): void;
};

export function PianoKeyboard({ value, midis, midiRange, onChange, onPlay }: PianoKeyboardProps) {
  const keyRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const range = midiRange ?? [60, 71];
  const keys = (midis ?? Array.from({ length: range[1] - range[0] + 1 }, (_, index) => range[0] + index))
    .map(keyForMidi);

  const activate = (midi: number) => {
    onPlay(midi);
    onChange(value.includes(midi) ? value.filter((note) => note !== midi) : [...value, midi]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = (index + direction + keys.length) % keys.length;
    keyRefs.current[next]?.focus();
  };

  return (
    <div aria-label="钢琴键盘" className="mx-auto flex max-w-4xl items-start justify-start overflow-x-auto rounded-[2rem] bg-[#102a43] p-4 shadow-[0_24px_70px_rgba(11,34,54,.2)]" role="group">
      {keys.map((key, index) => (
        <button
          ref={(node) => { keyRefs.current[index] = node; }}
          aria-label={key.label}
          aria-pressed={value.includes(key.midi)}
          className={`${key.black ? 'z-10 -mx-3 h-28 w-8 bg-[#0b2236] text-[#fff4d6]' : 'h-44 w-14 bg-[#fffaf0] text-[#102a43]'} shrink-0 rounded-b-xl border border-[#102a43]/30 pb-3 text-xs font-bold transition duration-150 hover:-translate-y-1 aria-pressed:bg-[#e7c55f]`}
          key={key.midi}
          onClick={() => activate(key.midi)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          type="button"
        >
          <span className="flex h-full items-end justify-center">{key.label}</span>
        </button>
      ))}
    </div>
  );
}
