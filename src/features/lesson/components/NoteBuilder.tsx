import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { parseNote } from '../../../domain/music/pitch';
import type { NoteName } from '../../../domain/music/types';

const NOTES: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

type NoteBuilderProps = {
  ariaLabel: string;
  value: NoteName[];
  onChange(value: NoteName[]): void;
  maxNotes: number;
};

function upwardSemitones(from: NoteName, to: NoteName): number {
  const difference = parseNote(`${to}4`).midi - parseNote(`${from}4`).midi;
  return difference < 0 ? difference + 12 : difference;
}

export function NoteBuilder({ ariaLabel, value, onChange, maxNotes }: NoteBuilderProps) {
  const [notes, setNotes] = useState(value);
  const choices = useRef<Array<HTMLButtonElement | null>>([]);
  useEffect(() => setNotes(value), [value]);

  const add = (note: NoteName) => {
    const next = [...notes, note].slice(0, maxNotes);
    setNotes(next);
    onChange(next);
  };
  const navigate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    choices.current[(index + direction + NOTES.length) % NOTES.length]?.focus();
  };

  return (
    <div aria-label={ariaLabel} className="mx-auto max-w-4xl" role="group">
      <div className="mb-7 flex min-h-28 items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-[#102a43]/40 bg-[#fffaf0]/70 px-5">
        {notes.length === 0 ? <span className="text-[#102a43]/60">从音名中选择</span> : notes.map((note, index) => (
          <div className="flex items-center gap-3" key={`${note}-${index}`}>
            <span className="grid size-14 place-items-center rounded-full bg-[#102a43] font-serif text-xl font-bold text-[#fff4d6]">{note}</span>
            {index > 0 && <span className="text-sm font-bold text-[#4eaa94]">{upwardSemitones(notes[0], note)} 半音</span>}
          </div>
        ))}
      </div>
      {notes.length > 1 && <p className="mb-5 text-center font-bold text-[#102a43]">{notes[0]} → {notes.at(-1)} · {upwardSemitones(notes[0], notes.at(-1)!)} 半音</p>}
      <div className="flex flex-wrap justify-center gap-3">
        {NOTES.map((note, index) => (
          <button
            ref={(node) => { choices.current[index] = node; }}
            aria-label={`添加 ${note}`}
            className="size-14 rounded-full border-2 border-[#102a43] bg-[#fffaf0] font-serif text-lg font-bold text-[#102a43] transition hover:-translate-y-1 hover:bg-[#e7c55f]"
            key={note}
            onClick={() => add(note)}
            onKeyDown={(event) => navigate(event, index)}
            type="button"
          >{note}</button>
        ))}
      </div>
    </div>
  );
}
