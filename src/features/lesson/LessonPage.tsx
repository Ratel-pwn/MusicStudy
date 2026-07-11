import { useEffect, useMemo, useState, type ComponentType } from 'react';
import type { Lesson, LessonStep, LessonStepType } from '../../content/schema';
import { useAudio } from '../../audio/useAudio';
import type { NoteName } from '../../domain/music/types';
import { parseNote } from '../../domain/music/pitch';
import { useProgressStore } from '../../stores/useProgressStore';
import { ChordBuilder } from './components/ChordBuilder';
import { FeedbackSheet } from './components/FeedbackSheet';
import { PianoKeyboard } from './components/PianoKeyboard';
import { RhythmGrid, type RhythmValue } from './components/RhythmGrid';
import { ScaleBuilder } from './components/ScaleBuilder';
import { applyStudioTransfer } from './studioTransfer';
import {
  createLessonSession,
  getCurrentStep,
  getExpectedAnswer,
  getHint,
  requestHint,
  scoreLesson,
  submitAnswer,
  type FeedbackResult,
  type LessonSession,
} from './lessonEngine';

export type StepProps = {
  step: LessonStep;
  answer: unknown;
  setAnswer(answer: unknown): void;
  playMidi(midi: number): void;
  playSequence?(midis: number[], intervalBeats?: number): void;
  now?(): number;
};

const midiLabel = (midi: number) => {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
};

function KeyboardStep({ step, setAnswer, playMidi }: StepProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [played, setPlayed] = useState<string[]>([]);
  const expected = getExpectedAnswer(step);
  const authoredNotes = Array.isArray(expected) ? expected : [expected];
  const requiredMidis = authoredNotes
    .filter((note): note is string => typeof note === 'string' && /-?\d+$/.test(note))
    .map((note) => parseNote(note).midi);
  const midiRange = requiredMidis.length > 0
    ? [Math.min(60, ...requiredMidis), Math.max(71, ...requiredMidis)] as const
    : [48, 72] as const;
  return (
    <PianoKeyboard
      midiRange={midiRange}
      onChange={setSelected}
      onPlay={(midi) => {
        playMidi(midi);
        const label = midiLabel(midi);
        if (!Array.isArray(expected)) {
          setAnswer(label);
          return;
        }
        const next = [...played, label].slice(-expected.length);
        setPlayed(next);
        setAnswer(next);
      }}
      value={selected}
    />
  );
}

function RhythmStep({ step, answer, setAnswer }: StepProps) {
  const units = Array.isArray(step.config.units) ? step.config.units : undefined;
  if (!units) {
    const bars = (answer as { bars?: string[] } | undefined)?.bars ?? Array(8).fill('A');
    return (
      <div className="mx-auto grid max-w-4xl grid-cols-4 gap-3" role="group" aria-label="八小节结构">
        {bars.map((section, index) => (
          <button
            aria-label={`第 ${index + 1} 小节，段落 ${section}`}
            className="min-h-24 rounded-2xl border-2 border-[#102a43] bg-[#fffaf0] font-bold text-[#102a43]"
            key={index}
            onClick={() => {
              const next = [...bars];
              next[index] = next[index] === 'A' ? 'B' : 'A';
              setAnswer({ bars: next });
            }}
            type="button"
          >{index + 1}<span className="block">{section}</span></button>
        ))}
      </div>
    );
  }
  return <RhythmGrid length={units.length} onChange={setAnswer} value={(answer as Array<RhythmValue | null> | undefined) ?? []} />;
}

function RhythmTapStep({ step, answer, setAnswer, now = () => performance.now() }: StepProps) {
  const authoredAccents = Array.isArray(step.config.accents) ? step.config.accents as number[] : undefined;
  const taps = Array.isArray(answer) ? answer : (answer as { timestamps?: number[] } | undefined)?.timestamps ?? [];
  const accents = (answer as { accents?: number[] } | undefined)?.accents ?? [];
  const [accentNext, setAccentNext] = useState(false);
  const target = getExpectedAnswer(step) as number[];
  const tap = () => {
    const nextTaps = [...taps, now()].slice(0, target.length);
    if (!authoredAccents) setAnswer(nextTaps);
    else {
      const bar = nextTaps.length;
      setAnswer({ timestamps: nextTaps, accents: accentNext ? [...accents, bar] : accents });
      setAccentNext(false);
    }
  };
  return (
    <div className="text-center">
      {authoredAccents && <button aria-pressed={accentNext} className="mb-4 rounded-full border-2 border-[#102a43] px-5 py-3 font-bold" onClick={() => setAccentNext((value) => !value)} type="button">下一小节重拍</button>}
      <button
        aria-label={`打拍，${taps.length} / ${target.length}`}
        className="mx-auto grid size-48 place-items-center rounded-full border-4 border-[#102a43] bg-[#e7c55f] font-serif text-3xl font-bold text-[#102a43] shadow-[0_12px_0_#102a43] active:translate-y-2 active:shadow-[0_4px_0_#102a43]"
        onClick={tap}
        type="button"
      >拍</button>
    </div>
  );
}

function ScaleStep({ step, answer, setAnswer }: StepProps) {
  const availableNotes = [...new Set(getExpectedAnswer(step) as NoteName[])];
  return <ScaleBuilder availableNotes={availableNotes} onChange={setAnswer} value={(answer as NoteName[] | undefined) ?? []} />;
}

function ChordStep({ step, answer, setAnswer }: StepProps) {
  const availableNotes = [...new Set(getExpectedAnswer(step) as NoteName[])];
  return <ChordBuilder availableNotes={availableNotes} onChange={setAnswer} value={(answer as NoteName[] | undefined) ?? []} />;
}

function ChoiceStep({ step, answer, setAnswer, playSequence }: StepProps) {
  const choices = Array.isArray(step.config.choices) ? step.config.choices : [];
  return (
    <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3" role="group" aria-label="可选答案">
      <button className="rounded-full border-2 border-[#102a43] px-6 py-3 font-bold" onClick={() => playSequence?.([60, 67, 60, 65], .5)} type="button">试听比较</button>
      {choices.map((choice) => (
        <button
          aria-pressed={answer === choice}
          className="rounded-full border-2 border-[#102a43] bg-[#fffaf0] px-6 py-3 font-bold text-[#102a43] aria-pressed:bg-[#e7c55f]"
          key={String(choice)}
          onClick={() => setAnswer(choice)}
          type="button"
        >{String(choice)}</button>
      ))}
    </div>
  );
}

function ListenStep({ step, setAnswer, playMidi, playSequence }: StepProps) {
  const source = (step.config.sequence ?? step.config.notes ?? step.config.arpeggio) as string[] | undefined;
  const demonstrate = () => {
    const formNotes = typeof step.config.bars === 'number'
      ? Array.from({ length: step.config.bars }, (_, index) => index < 4 ? 'C4' : index === 7 ? 'C5' : 'E4')
      : undefined;
    const audible = source ?? (Array.isArray(step.config.pairs) ? (step.config.pairs as string[][]).flat() : formNotes ?? ['C4', 'E4', 'G4', 'C5']);
    const midis = audible.map((note) => parseNote(note).midi);
    if (playSequence) playSequence(midis, .5);
    else midis.forEach(playMidi);
    setAnswer({ listened: true, sampleCount: audible.length });
  };
  return (
    <button className="mx-auto block rounded-full bg-[#102a43] px-7 py-4 font-bold text-[#fff4d6]" onClick={demonstrate} type="button">
      播放示范
    </button>
  );
}

function StudioTransferStep({ step, setAnswer }: StepProps) {
  const [applying, setApplying] = useState(false);
  return (
    <button
      className="mx-auto block rounded-full bg-[#102a43] px-7 py-4 font-bold text-[#fff4d6] disabled:opacity-50"
      disabled={applying}
      onClick={() => {
        setApplying(true);
        void applyStudioTransfer(step).then(setAnswer).finally(() => setApplying(false));
      }}
      type="button"
    >{applying ? '正在写入作品' : '写入作品'}</button>
  );
}

function ExplainStep({ setAnswer }: StepProps) {
  return (
    <button className="mx-auto block rounded-full border-2 border-[#102a43] bg-[#fffaf0] px-7 py-4 font-bold text-[#102a43]" onClick={() => setAnswer(true)} type="button">
      我看清了
    </button>
  );
}

export const stepRenderers: Record<LessonStepType, ComponentType<StepProps>> = {
  listen: ListenStep,
  explain: ExplainStep,
  keyboard: KeyboardStep,
  choice: ChoiceStep,
  rhythmTap: RhythmTapStep,
  rhythmBuild: RhythmStep,
  scaleBuild: ScaleStep,
  chordBuild: ChordStep,
  studioTransfer: StudioTransferStep,
};

function storageKey(lessonId: string) {
  return `musicstudy:lesson:${lessonId}`;
}

function restoreSession(lesson: Lesson): LessonSession {
  const raw = localStorage.getItem(storageKey(lesson.id));
  if (!raw) return createLessonSession(lesson);
  try {
    const restored = JSON.parse(raw) as LessonSession;
    return restored.lessonId === lesson.id
      ? {
          ...restored,
          completedVariant: restored.completedVariant ?? false,
          completedChallenge: restored.completedChallenge ?? false,
          hintsUsed: restored.hintsUsed ?? 0,
          steps: lesson.steps,
        }
      : createLessonSession(lesson);
  } catch {
    return createLessonSession(lesson);
  }
}

export function LessonPage({ lesson, onExit }: { lesson: Lesson; onExit(): void }) {
  const { engine, status, unlock } = useAudio();
  const completeLesson = useProgressStore((state) => state.completeLesson);
  const recordAttempt = useProgressStore((state) => state.recordAttempt);
  const [session, setSession] = useState(() => restoreSession(lesson));
  const [answer, setAnswer] = useState<unknown>();
  const [feedback, setFeedback] = useState<FeedbackResult>();
  const step = session.stepIndex < lesson.steps.length ? getCurrentStep(session) : undefined;
  const progress = Math.min(100, ((session.stepIndex + 1) / lesson.steps.length) * 100);
  const Renderer = step ? stepRenderers[step.type] : null;

  useEffect(() => {
    setAnswer(undefined);
  }, [step?.id]);

  useEffect(() => {
    if (session.stepIndex < lesson.steps.length) {
      localStorage.setItem(storageKey(lesson.id), JSON.stringify(session));
    }
  }, [lesson.id, lesson.steps.length, session]);

  const score = useMemo(() => scoreLesson(session), [session]);

  const playMidi = async (midi: number) => {
    if (status !== 'ready') await unlock();
    engine.playMidi(midi);
  };

  const submit = () => {
    if (!step || answer === undefined) return;
    const result = submitAnswer(session, answer);
    setSession(result.session);
    setFeedback(result.feedback);
    void recordAttempt({
      lessonId: lesson.id,
      skillIds: step.skillIds,
      correct: result.feedback.correct,
      hints: session.hintLevel,
      ...(result.feedback.errorCode ? { errorCode: result.feedback.errorCode } : {}),
    });
  };

  const continueLesson = async () => {
    setFeedback(undefined);
    setAnswer(undefined);
    if (session.stepIndex < lesson.steps.length) return;
    const result = scoreLesson(session);
    await completeLesson({
      lessonId: lesson.id,
      score: result.score,
      hints: session.hintsUsed,
      completedVariant: session.completedVariant,
      completedChallenge: session.completedChallenge,
      xp: lesson.xp,
    });
    localStorage.removeItem(storageKey(lesson.id));
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_85%_10%,rgba(231,197,95,.28),transparent_28%),linear-gradient(145deg,#f6ecd7,#fffaf0)] text-[#102a43]">
      <header className="mx-auto flex max-w-6xl items-center gap-5 px-5 py-5">
        <button className="rounded-full border-2 border-[#102a43] px-4 py-2 font-bold" onClick={onExit} type="button">退出课程</button>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#102a43]/15" role="progressbar" aria-label="课程进度" aria-valuenow={progress}>
          <div className="h-full rounded-full bg-[#4eaa94] transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
        <strong>{Math.min(session.stepIndex + 1, lesson.steps.length)} / {lesson.steps.length}</strong>
      </header>

      {step && Renderer ? (
        <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-col px-5 pb-32 pt-8">
          <h1 className="mx-auto mb-12 max-w-4xl text-center font-serif text-[clamp(2rem,4vw,4.5rem)] font-bold leading-tight">{step.prompt}</h1>
          <div className="my-auto">
            <Renderer
              key={step.id}
              answer={answer}
              playMidi={(midi) => void playMidi(midi)}
              playSequence={(midis, interval) => engine.playSequence(midis, interval)}
              setAnswer={setAnswer}
              step={step}
            />
          </div>
          {session.requiresVariant && <p className="mt-8 text-center font-bold text-[#ef765d]">需要一个变式</p>}
          {session.hintLevel > 0 && <p className="mt-4 text-center">提示 {session.hintLevel}：{getHint(session)}</p>}
          <footer className="mt-10 flex justify-center gap-3">
            <button className="rounded-full border-2 border-[#102a43] px-6 py-3 font-bold" onClick={() => setSession(requestHint(session))} type="button">提示</button>
            <button className="rounded-full bg-[#102a43] px-8 py-3 font-bold text-[#fff4d6] disabled:opacity-40" disabled={answer === undefined} onClick={submit} type="button">提交答案</button>
          </footer>
        </section>
      ) : (
        <section className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-5 text-center">
          <div><h1 className="font-serif text-5xl font-bold">课程完成</h1><p className="text-xl">{score.score} 分 · {score.stars} 星</p></div>
        </section>
      )}

      <FeedbackSheet
        correct={feedback?.correct ?? false}
        level={feedback?.level ?? 0}
        message={feedback?.message}
        onContinue={() => void continueLesson()}
        onDismiss={() => setFeedback(undefined)}
        open={feedback !== undefined}
      />
    </main>
  );
}
