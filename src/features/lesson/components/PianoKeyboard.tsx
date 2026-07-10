import { useRef, type KeyboardEvent } from 'react';

const KEYS = [
  { label: 'C4', midi: 60, black: false }, { label: 'C#4', midi: 61, black: true },
  { label: 'D4', midi: 62, black: false }, { label: 'D#4', midi: 63, black: true },
  { label: 'E4', midi: 64, black: false }, { label: 'F4', midi: 65, black: false },
  { label: 'F#4', midi: 66, black: true }, { label: 'G4', midi: 67, black: false },
  { label: 'G#4', midi: 68, black: true }, { label: 'A4', midi: 69, black: false },
  { label: 'A#4', midi: 70, black: true }, { label: 'B4', midi: 71, black: false },
] as const;

type PianoKeyboardProps = {
  value: number[];
  onChange(value: number[]): void;
  onPlay(midi: number): void;
};

export function PianoKeyboard({ value, onChange, onPlay }: PianoKeyboardProps) {
  const keyRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activate = (midi: number) => {
    onPlay(midi);
    onChange(value.includes(midi) ? value.filter((note) => note !== midi) : [...value, midi]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = (index + direction + KEYS.length) % KEYS.length;
    keyRefs.current[next]?.focus();
  };

  return (
    <div aria-label="钢琴键盘" className="mx-auto flex max-w-4xl items-start justify-center rounded-[2rem] bg-[#102a43] p-4 shadow-[0_24px_70px_rgba(11,34,54,.2)]" role="group">
      {KEYS.map((key, index) => (
        <button
          ref={(node) => { keyRefs.current[index] = node; }}
          aria-label={key.label}
          aria-pressed={value.includes(key.midi)}
          className={`${key.black ? 'z-10 -mx-3 h-28 w-8 bg-[#0b2236] text-[#fff4d6]' : 'h-44 w-14 bg-[#fffaf0] text-[#102a43]'} rounded-b-xl border border-[#102a43]/30 pb-3 text-xs font-bold transition duration-150 hover:-translate-y-1 aria-pressed:bg-[#e7c55f]`}
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
