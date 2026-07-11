import type { ReactNode } from 'react';
import type { LessonStep } from '../../../content/schema';

type VisualFrameProps = {
  label: string;
  children: ReactNode;
  footer: string;
};

function VisualFrame({ label, children, footer }: VisualFrameProps) {
  return (
    <figure
      aria-label={label}
      className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-[2.25rem] border-2 border-[#102a43] bg-[#fffaf0] shadow-[0_18px_0_rgba(16,42,67,.12)]"
      role="img"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(16,42,67,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,42,67,.05)_1px,transparent_1px)] [background-size:2rem_2rem]" />
      <div className="relative min-h-64 px-5 py-6 sm:min-h-72 sm:px-8 sm:py-8">{children}</div>
      <figcaption className="relative border-t-2 border-[#102a43] bg-[#102a43] px-5 py-3 text-center text-sm font-bold tracking-[.05em] text-[#fff4d6]">
        {footer}
      </figcaption>
    </figure>
  );
}

function PitchTrailVisual() {
  return (
    <VisualFrame footer="画面位置升高，声音也随之升高" label="音高由低向高移动的竖直轨迹">
      <div className="grid min-h-52 grid-cols-[1fr_5rem_1fr] items-center gap-3 sm:grid-cols-[1fr_8rem_1fr]">
        <div className="text-right">
          <strong className="block font-serif text-3xl sm:text-5xl">低音</strong>
          <span className="mt-2 block text-sm font-bold text-[#102a43]/65">振动较慢</span>
        </div>
        <div className="relative mx-auto h-48 w-12">
          <div className="absolute inset-y-2 left-1/2 w-1 -translate-x-1/2 rounded-full bg-[#102a43]/20" />
          <div className="absolute bottom-1 left-1/2 size-9 -translate-x-1/2 rounded-full border-4 border-[#102a43] bg-[#e7c55f] shadow-[0_0_0_8px_rgba(231,197,95,.22)]" />
          <div className="absolute left-1/2 top-1 size-9 -translate-x-1/2 rounded-full border-4 border-[#102a43] bg-[#4eaa94] shadow-[0_0_0_8px_rgba(78,170,148,.2)]" />
          <svg aria-hidden className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 48 192">
            <path d="M36 155 C12 135 12 75 34 40" fill="none" stroke="#ef765d" strokeLinecap="round" strokeWidth="5" />
            <path d="M25 43 L35 35 L39 48" fill="none" stroke="#ef765d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
          </svg>
        </div>
        <div>
          <strong className="block font-serif text-3xl sm:text-5xl">高音</strong>
          <span className="mt-2 block text-sm font-bold text-[#102a43]/65">振动较快</span>
        </div>
      </div>
    </VisualFrame>
  );
}

const whiteKeys = ['B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];

function MiddleCVisual() {
  return (
    <VisualFrame footer="找到两枚黑键，再看它们紧邻左侧的白键" label="两枚黑键左侧的中央 C 位置">
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-5">
        <div className="mb-4 flex items-center gap-3 text-sm font-bold">
          <span className="h-px w-14 bg-[#102a43]" />两枚黑键的左邻居<span className="h-px w-14 bg-[#102a43]" />
        </div>
        <div className="relative flex h-44 w-full max-w-xl overflow-hidden rounded-2xl border-2 border-[#102a43] bg-[#102a43] p-1">
          {whiteKeys.map((note) => (
            <div className={`${note === 'C4' ? 'bg-[#e7c55f]' : 'bg-[#fffaf0]'} flex min-w-0 flex-1 items-end justify-center border-r border-[#102a43]/35 pb-3 text-xs font-bold last:border-r-0`} key={note}>
              {note}
            </div>
          ))}
          <div className="absolute left-[21%] top-1 h-24 w-[8%] rounded-b-lg bg-[#102a43]" />
          <div className="absolute left-[33.5%] top-1 h-24 w-[8%] rounded-b-lg bg-[#102a43]" />
          <div className="absolute left-[58.5%] top-1 h-24 w-[8%] rounded-b-lg bg-[#102a43]" />
        </div>
        <strong className="mt-4 rounded-full bg-[#e7c55f] px-5 py-2 text-sm">中央 C = C4</strong>
      </div>
    </VisualFrame>
  );
}

function WhiteNotesVisual({ labels }: { labels: string[] }) {
  const sequence = [...labels, labels[0]];
  return (
    <VisualFrame footer="B 之后回到下一个 C，音名从这里重新循环" label="C 到 B 的白键音名循环">
      <div className="flex min-h-52 flex-col justify-center">
        <div className="grid grid-flow-dense grid-cols-8 overflow-hidden rounded-2xl border-2 border-[#102a43]">
          {sequence.map((note, index) => (
            <div className={`${index === 0 || index === sequence.length - 1 ? 'bg-[#e7c55f]' : 'bg-[#fffaf0]'} grid min-h-32 place-items-end border-r border-[#102a43]/30 pb-5 last:border-r-0`} key={`${note}-${index}`}>
              <strong className="font-serif text-xl sm:text-3xl">{note}</strong>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-5 flex w-[88%] items-center text-sm font-bold text-[#102a43]/70">
          <span>从 C 出发</span><span className="mx-3 h-px flex-1 bg-[#ef765d]" /><span>回到 C</span>
        </div>
      </div>
    </VisualFrame>
  );
}

function QuarterPulseVisual() {
  return (
    <VisualFrame footer="四枚四分音符等距排列，正好组成一小节" label="四枚四分音符填满四四拍小节">
      <div className="flex min-h-52 flex-col justify-center">
        <div className="mb-4 flex items-end justify-between font-bold"><span className="font-serif text-4xl">4/4</span><span className="text-sm text-[#102a43]/65">每一格 = 一拍</span></div>
        <div className="grid grid-flow-dense grid-cols-4 overflow-hidden rounded-2xl border-2 border-[#102a43] bg-[#fffaf0]">
          {[1, 2, 3, 4].map((beat) => (
            <div className="grid min-h-32 place-items-center border-r-2 border-[#102a43]/30 last:border-r-0" key={beat}>
              <div className="text-center"><span className="block font-serif text-5xl leading-none">♩</span><strong className="mt-2 block">第 {beat} 拍</strong></div>
            </div>
          ))}
        </div>
      </div>
    </VisualFrame>
  );
}

function EighthSubdivisionVisual({ syllables }: { syllables: string[] }) {
  return (
    <VisualFrame footer="拍点与中点交替出现，每两个位置共同占一拍" label="一和二和的均匀八分细分">
      <div className="flex min-h-52 flex-col justify-center">
        <div className="relative grid grid-flow-dense grid-cols-4">
          <div className="absolute left-[12.5%] right-[12.5%] top-5 h-1 rounded-full bg-[#102a43]/25" />
          {syllables.map((syllable, index) => (
            <div className="relative text-center" key={`${syllable}-${index}`}>
              <span className={`${index % 2 === 0 ? 'size-11 bg-[#e7c55f]' : 'size-8 bg-[#4eaa94]'} relative z-10 mx-auto grid place-items-center rounded-full border-2 border-[#102a43] font-bold`} />
              <strong className={`${index % 2 === 0 ? 'text-4xl' : 'text-2xl text-[#102a43]/70'} mt-5 block font-serif`}>{syllable}</strong>
              <span className="mt-2 block text-xs font-bold text-[#102a43]/55">{index % 2 === 0 ? '拍点' : '正中间'}</span>
            </div>
          ))}
        </div>
      </div>
    </VisualFrame>
  );
}

function ScaleSemitoneVisual() {
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
  return (
    <VisualFrame footer="白键相邻并不总是全音，E–F 与 B–C 只有半音" label="C 大调与两组半音位置">
      <div className="flex min-h-52 flex-col justify-center">
        <div className="grid grid-flow-dense grid-cols-8 overflow-hidden rounded-2xl border-2 border-[#102a43]">
          {notes.map((note, index) => (
            <div className={`${index === 2 || index === 3 || index === 6 || index === 7 ? 'bg-[#e7c55f]' : 'bg-[#fffaf0]'} relative grid min-h-32 place-items-center border-r border-[#102a43]/30 last:border-r-0`} key={`${note}-${index}`}>
              <strong className="font-serif text-3xl">{note}</strong>
              {(index === 2 || index === 6) && <span className="absolute right-1 top-2 z-10 rounded-full bg-[#ef765d] px-2 py-1 text-[10px] font-bold text-white">半音</span>}
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 text-center text-sm font-bold"><span>E 与 F 紧邻</span><span>B 与 C 紧邻</span></div>
      </div>
    </VisualFrame>
  );
}

function ChordDegreesVisual({ degrees }: { degrees: number[] }) {
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  return (
    <VisualFrame footer="从 C 开始隔一个音取一个音，第 1、3、5 级汇成 C–E–G" label="C 大调第一第三第五级组成和弦">
      <div className="flex min-h-52 flex-col justify-center">
        <div className="grid grid-flow-dense grid-cols-7 gap-2 sm:gap-3">
          {notes.map((note, index) => {
            const selected = degrees.includes(index + 1);
            return (
              <div className={`${selected ? 'translate-y-0 border-[#102a43] bg-[#e7c55f] shadow-[0_8px_0_#102a43]' : 'translate-y-4 border-[#102a43]/25 bg-[#fffaf0] text-[#102a43]/45'} grid aspect-square place-items-center rounded-full border-2 transition-transform duration-500`} key={note}>
                <div className="text-center"><strong className="block font-serif text-xl sm:text-3xl">{note}</strong><span className="text-[10px] font-bold">{index + 1} 级</span></div>
              </div>
            );
          })}
        </div>
        <div className="mx-auto mt-9 flex items-center gap-3 font-serif text-2xl font-bold"><span>C</span><span className="text-[#ef765d]">—</span><span>E</span><span className="text-[#ef765d]">—</span><span>G</span></div>
      </div>
    </VisualFrame>
  );
}

function EightBarVisual() {
  return (
    <VisualFrame footer="前四小节提出材料，后四小节沿用材料并改变结尾" label="前四小节建立后四小节回应的八小节结构">
      <div className="flex min-h-52 flex-col justify-center">
        <div className="mb-3 grid grid-cols-2 text-center text-sm font-bold"><span>建立动机</span><span>重复并收束</span></div>
        <div className="grid grid-flow-dense grid-cols-4 gap-2 sm:grid-cols-8">
          {Array.from({ length: 8 }, (_, index) => (
            <div className={`${index < 4 ? 'bg-[#4eaa94]' : index === 7 ? 'bg-[#ef765d]' : 'bg-[#e7c55f]'} grid min-h-24 place-items-center rounded-xl border-2 border-[#102a43] text-center font-bold`} key={index}>
              <span><strong className="block font-serif text-2xl">{index + 1}</strong>{index === 7 ? '变化' : index < 4 ? 'A' : 'A′'}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2"><span className="h-1 rounded-full bg-[#4eaa94]" /><span className="h-1 rounded-full bg-[linear-gradient(90deg,#e7c55f_75%,#ef765d_75%)]" /></div>
      </div>
    </VisualFrame>
  );
}

function GenericConceptVisual() {
  return (
    <VisualFrame footer="沿着线条比较音符的位置与关系" label="音乐概念示意图">
      <div className="relative flex min-h-52 items-center justify-center">
        <div className="absolute inset-x-[8%] top-1/2 grid -translate-y-1/2 gap-4">
          {Array.from({ length: 5 }, (_, index) => <span className="h-px bg-[#102a43]/35" key={index} />)}
        </div>
        <div className="relative size-16 rounded-full border-4 border-[#102a43] bg-[#e7c55f] shadow-[5rem_-2rem_0_-1rem_#4eaa94]" />
      </div>
    </VisualFrame>
  );
}

export function ExplainVisual({ step }: { step: LessonStep }) {
  if (step.config.visual === 'verticalPitchTrail') return <PitchTrailVisual />;
  if (step.config.landmark === 'twoBlackKeysLeft') return <MiddleCVisual />;
  if (Array.isArray(step.config.labels)) return <WhiteNotesVisual labels={step.config.labels.filter((item): item is string => typeof item === 'string')} />;
  if (step.config.meter === '4/4' && step.config.beatUnit === 'quarter') return <QuarterPulseVisual />;
  if (Array.isArray(step.config.countSyllables)) return <EighthSubdivisionVisual syllables={step.config.countSyllables.filter((item): item is string => typeof item === 'string')} />;
  if (Array.isArray(step.config.semitonePairs)) return <ScaleSemitoneVisual />;
  if (Array.isArray(step.config.degrees)) return <ChordDegreesVisual degrees={step.config.degrees.filter((item): item is number => typeof item === 'number')} />;
  if (Array.isArray(step.config.sections)) return <EightBarVisual />;
  return <GenericConceptVisual />;
}
