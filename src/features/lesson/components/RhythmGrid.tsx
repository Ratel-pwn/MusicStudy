import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react';

export type RhythmValue = 'quarter' | 'eighth';
type RhythmGridProps = { value: Array<RhythmValue | null>; onChange(value: Array<RhythmValue | null>): void };

const palette: Array<{ value: RhythmValue; label: string; glyph: string }> = [
  { value: 'quarter', label: '四分音符', glyph: '♩' },
  { value: 'eighth', label: '八分音符', glyph: '♪' },
];

export function RhythmGrid({ value, onChange }: RhythmGridProps) {
  const [selected, setSelected] = useState<RhythmValue>('quarter');
  const beatRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const beats = Array.from({ length: 4 }, (_, index) => value[index] ?? null);
  const place = (index: number, rhythmValue: RhythmValue) => {
    const next = [...beats];
    next[index] = rhythmValue;
    onChange(next);
  };
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    beatRefs.current[(index + direction + beats.length) % beats.length]?.focus();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div aria-label="节奏素材" className="mb-6 flex justify-center gap-3" role="group">
        {palette.map((item) => (
          <button
            aria-label={item.label}
            aria-pressed={selected === item.value}
            className="rounded-full border-2 border-[#102a43] bg-[#fffaf0] px-5 py-3 font-bold text-[#102a43] aria-pressed:bg-[#e7c55f]"
            draggable
            key={item.value}
            onClick={() => setSelected(item.value)}
            onDragStart={(event) => event.dataTransfer.setData('text/rhythm', item.value)}
            type="button"
          >{item.glyph} {item.label}</button>
        ))}
      </div>
      <div aria-label="四拍节奏格" className="grid grid-cols-4 overflow-hidden rounded-[1.75rem] border-2 border-[#102a43] bg-[#fffaf0]" role="group">
        {beats.map((beat, index) => (
          <button
            ref={(node) => { beatRefs.current[index] = node; }}
            aria-label={`第 ${index + 1} 拍，${beat ? palette.find((item) => item.value === beat)?.label : '空'}`}
            className="aspect-square border-r border-[#102a43]/30 text-3xl font-bold text-[#102a43] last:border-r-0 hover:bg-[#e7c55f]/30"
            key={index}
            onClick={() => place(index, selected)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event: DragEvent<HTMLButtonElement>) => {
              event.preventDefault();
              const dropped = event.dataTransfer.getData('text/rhythm') as RhythmValue;
              if (dropped === 'quarter' || dropped === 'eighth') place(index, dropped);
            }}
            onKeyDown={(event) => move(event, index)}
            type="button"
          >{beat === 'quarter' ? '♩' : beat === 'eighth' ? '♪' : index + 1}</button>
        ))}
      </div>
    </div>
  );
}
