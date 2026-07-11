import { useEffect, useMemo, useRef, useState, type ComponentType, type MouseEvent } from 'react';
import type { Lesson, LessonStep, LessonStepType } from '../../content/schema';
import { useAudio } from '../../audio/useAudio';
import type { TimedAudioEvent } from '../../audio/AudioEngine';
import type { NoteName } from '../../domain/music/types';
import { parseNote } from '../../domain/music/pitch';
import { useProgressStore } from '../../stores/useProgressStore';
import { ChordBuilder } from './components/ChordBuilder';
import { ExplainVisual } from './components/ExplainVisual';
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
  playTimed?(events: readonly TimedAudioEvent[]): void;
  startMetronome?(bpm: number): Promise<number>;
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

function RhythmTapStep({ step, answer, setAnswer, startMetronome, now = () => performance.now() }: StepProps) {
  const authoredAccents = Array.isArray(step.config.accents) ? step.config.accents as number[] : undefined;
  const rhythmAnswer = answer as { timestamps?: number[]; targetTimestamps?: number[]; accents?: number[] } | undefined;
  const taps = rhythmAnswer?.timestamps ?? [];
  const targetTimestamps = rhythmAnswer?.targetTimestamps ?? [];
  const accents = rhythmAnswer?.accents ?? [];
  const [accentNext, setAccentNext] = useState(false);
  const target = getExpectedAnswer(step) as number[];
  const bpm = typeof step.config.bpm === 'number' ? step.config.bpm : 90;
  const interval = 60_000 / bpm / (typeof step.config.subdivision === 'number' ? step.config.subdivision : 1) * (authoredAccents ? 4 : 1);
  const start = async () => {
    if (!startMetronome) return;
    const startedAt = await startMetronome(bpm);
    setAnswer({
      timestamps: [],
      targetTimestamps: Array.from({ length: target.length }, (_, index) => startedAt + (index + 1) * interval),
      accents: [],
    });
  };
  const tap = () => {
    const nextTaps = [...taps, now()].slice(0, target.length);
    const bar = nextTaps.length;
    setAnswer({ timestamps: nextTaps, targetTimestamps, accents: authoredAccents && accentNext ? [...accents, bar] : accents });
    setAccentNext(false);
  };
  return (
    <div className="text-center">
      <p className="mb-4 font-bold">{bpm} BPM</p>
      <button className="mb-4 rounded-full bg-[#102a43] px-5 py-3 font-bold text-[#fff4d6]" onClick={() => void start()} type="button">开始节拍</button>
      {authoredAccents && <button aria-pressed={accentNext} className="mb-4 rounded-full border-2 border-[#102a43] px-5 py-3 font-bold" onClick={() => setAccentNext((value) => !value)} type="button">下一小节重拍</button>}
      <button
        aria-label={`打拍，${taps.length} / ${target.length}`}
        className="mx-auto grid size-48 place-items-center rounded-full border-4 border-[#102a43] bg-[#e7c55f] font-serif text-3xl font-bold text-[#102a43] shadow-[0_12px_0_#102a43] active:translate-y-2 active:shadow-[0_4px_0_#102a43]"
        disabled={targetTimestamps.length === 0 || taps.length >= target.length}
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

function ChoiceStep({ step, answer, setAnswer, playSequence, playTimed }: StepProps) {
  const choices = Array.isArray(step.config.choices) ? step.config.choices : [];
  const audioOptions = step.config.audioOptions as Record<string, string[] | TimedAudioEvent[]> | undefined;
  const preview = (choice: unknown) => {
    const material = audioOptions?.[String(choice)] ?? [];
    if (material.length > 0 && typeof material[0] === 'object') playTimed?.(material as TimedAudioEvent[]);
    else playSequence?.((material as string[]).map((note) => parseNote(note).midi), .5);
  };
  return (
    <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3" role="group" aria-label="可选答案">
      {choices.map((choice) => (
        <span className="flex gap-2" key={String(choice)}>
          <button
            className="rounded-full border-2 border-[#102a43] px-5 py-3 font-bold"
            onClick={() => preview(choice)}
            type="button"
          >试听 {String(choice)}</button>
          <button
            aria-pressed={answer === choice}
            className="rounded-full border-2 border-[#102a43] bg-[#fffaf0] px-6 py-3 font-bold text-[#102a43] aria-pressed:bg-[#e7c55f]"
            onClick={() => setAnswer(choice)}
            type="button"
          >{String(choice)}</button>
        </span>
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

function ExplainStep({ step, setAnswer }: StepProps) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <ExplainVisual step={step} />
      <button className="mx-auto mt-8 block rounded-full border-2 border-[#102a43] bg-[#fffaf0] px-7 py-4 font-bold text-[#102a43] transition-transform duration-200 hover:-translate-y-1" onClick={() => setAnswer(true)} type="button">
        我看清了
      </button>
    </div>
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

type GuidedStepAction = {
  cue: string;
  pendingLabel: string;
  readyMessage: string;
};

const guidedStepActions: Partial<Record<LessonStepType, GuidedStepAction>> = {
  listen: {
    cue: '聆听示范 · 无需选择',
    pendingLabel: '播放后继续',
    readyMessage: '示范已播放，可以进入下一步。',
  },
  explain: {
    cue: '观察讲解 · 无需选择',
    pendingLabel: '确认理解后继续',
    readyMessage: '理解已确认，可以进入下一步。',
  },
  studioTransfer: {
    cue: '作品写入 · 无需选择',
    pendingLabel: '完成写入后继续',
    readyMessage: '作品已写入，可以进入下一步。',
  },
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

function RestartDialog({ open, onCancel, onConfirm }: { open: boolean; onCancel(): void; onConfirm(): void }) {
  if (!open) return null;
  const dismissFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onCancel();
  };
  return (
    <div className="fixed inset-0 z-90 grid place-items-center bg-[#102a43]/45 px-5 backdrop-blur-sm" onMouseDown={dismissFromBackdrop}>
      <div
        aria-describedby="restart-description"
        aria-labelledby="restart-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-[2rem] border-2 border-[#102a43] bg-[#fffaf0] p-6 shadow-[0_24px_0_rgba(16,42,67,.28)] sm:p-8"
        onKeyDown={(event) => { if (event.key === 'Escape') onCancel(); }}
        role="dialog"
      >
        <h2 className="font-serif text-3xl font-bold" id="restart-title">重新开始本关？</h2>
        <p className="mt-3 leading-relaxed text-[#102a43]/75" id="restart-description">本次关卡的答案、提示和进度会清空。已经获得的星级与学习记录会保留。</p>
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button autoFocus className="rounded-full border-2 border-[#102a43] px-6 py-3 font-bold text-[#102a43]" onClick={onCancel} type="button">继续学习</button>
          <button className="rounded-full border-2 border-[#102a43] bg-[#ef765d] px-6 py-3 font-bold text-[#102a43]" onClick={onConfirm} type="button">确认重新开始</button>
        </div>
      </div>
    </div>
  );
}

export function LessonPage({ lesson, onExit }: { lesson: Lesson; onExit(): void }) {
  const { engine, status, unlock } = useAudio();
  const completeLesson = useProgressStore((state) => state.completeLesson);
  const recordAttempt = useProgressStore((state) => state.recordAttempt);
  const [session, setSession] = useState(() => restoreSession(lesson));
  const [answer, setAnswer] = useState<unknown>();
  const [feedback, setFeedback] = useState<FeedbackResult>();
  const [restartOpen, setRestartOpen] = useState(false);
  const [runId, setRunId] = useState(0);
  const activeRunId = useRef(0);
  const step = session.stepIndex < lesson.steps.length ? getCurrentStep(session) : undefined;
  const progress = Math.min(100, ((session.stepIndex + 1) / lesson.steps.length) * 100);
  const Renderer = step ? stepRenderers[step.type] : null;
  const guidedAction = step ? guidedStepActions[step.type] : undefined;

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

  const playSequence = async (midis: number[], interval?: number) => {
    if (status !== 'ready') await unlock();
    engine.playSequence(midis, interval);
  };

  const playTimed = async (events: readonly TimedAudioEvent[]) => {
    if (status !== 'ready') await unlock();
    engine.playTimed(events);
  };

  const startMetronome = async (bpm: number): Promise<number> => {
    if (status !== 'ready') await unlock();
    return engine.startMetronome(bpm);
  };

  useEffect(() => () => engine.stop(), [engine]);

  const finishLesson = async (completedSession: LessonSession) => {
    const result = scoreLesson(completedSession);
    await completeLesson({
      lessonId: lesson.id,
      score: result.score,
      hints: completedSession.hintsUsed,
      completedVariant: completedSession.completedVariant,
      completedChallenge: completedSession.completedChallenge,
      xp: lesson.xp,
    });
    localStorage.removeItem(storageKey(lesson.id));
  };

  const submit = () => {
    if (!step || answer === undefined) return;
    const result = submitAnswer(session, answer);
    if (step.type === 'rhythmTap' && result.feedback.correct) engine.stop();
    setSession(result.session);
    const advanceDirectly = guidedAction && result.feedback.correct;
    if (advanceDirectly) {
      setFeedback(undefined);
      if (result.session.stepIndex >= lesson.steps.length) void finishLesson(result.session);
    } else {
      setFeedback(result.feedback);
    }
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
    await finishLesson(session);
  };

  const restartLesson = () => {
    engine.stop();
    activeRunId.current += 1;
    localStorage.removeItem(storageKey(lesson.id));
    setFeedback(undefined);
    setAnswer(undefined);
    setSession(createLessonSession(lesson));
    setRunId(activeRunId.current);
    setRestartOpen(false);
  };

  const rendererRunId = runId;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_85%_10%,rgba(231,197,95,.28),transparent_28%),linear-gradient(145deg,#f6ecd7,#fffaf0)] text-[#102a43]">
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-5 sm:gap-5">
        <button aria-label="退出课程" className="shrink-0 rounded-full border-2 border-[#102a43] px-3 py-2 text-sm font-bold sm:px-4 sm:text-base" onClick={onExit} type="button"><span className="hidden sm:inline">退出课程</span><span aria-hidden className="sm:hidden">退出</span></button>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#102a43]/15" role="progressbar" aria-label="课程进度" aria-valuenow={progress}>
          <div className="h-full rounded-full bg-[#4eaa94] transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
        <strong className="shrink-0 text-sm sm:text-base">{Math.min(session.stepIndex + 1, lesson.steps.length)} / {lesson.steps.length}</strong>
        <button aria-label="重新开始" className="shrink-0 rounded-full border-2 border-[#102a43] bg-[#e7c55f] px-3 py-2 text-sm font-bold transition-transform duration-200 hover:-translate-y-0.5 sm:px-4 sm:text-base" onClick={() => setRestartOpen(true)} type="button"><span className="hidden sm:inline">重新开始</span><span aria-hidden className="sm:hidden">重开</span></button>
      </header>

      {step && Renderer ? (
        <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-col px-5 pb-32 pt-8">
          <h1 className="mx-auto mb-12 max-w-4xl text-center font-serif text-[clamp(2rem,4vw,4.5rem)] font-bold leading-tight">{step.prompt}</h1>
          <div className="my-auto">
            <Renderer
              key={`${step.id}:${runId}`}
              answer={answer}
              playMidi={(midi) => void playMidi(midi)}
              playSequence={(midis, interval) => void playSequence(midis, interval)}
              playTimed={(events) => void playTimed(events)}
              startMetronome={startMetronome}
              setAnswer={(nextAnswer) => {
                if (activeRunId.current === rendererRunId) setAnswer(nextAnswer);
              }}
              step={step}
            />
          </div>
          {session.requiresVariant && <p className="mt-8 text-center font-bold text-[#ef765d]">需要一个变式</p>}
          {session.hintLevel > 0 && <p className="mt-4 text-center">提示 {session.hintLevel}：{getHint(session)}</p>}
          <footer className="mt-10 flex flex-col items-center gap-4">
            {guidedAction && (
              <div className="text-center">
                <strong className="block text-sm tracking-[.12em]">{guidedAction.cue}</strong>
                <span className="mt-1 block text-sm text-[#102a43]/70">
                  {answer === undefined ? '完成上方操作后即可继续。' : guidedAction.readyMessage}
                </span>
              </div>
            )}
            <div className="flex justify-center gap-3">
              <button className="rounded-full border-2 border-[#102a43] px-6 py-3 font-bold" onClick={() => setSession(requestHint(session))} type="button">提示</button>
              <button className="rounded-full bg-[#102a43] px-8 py-3 font-bold text-[#fff4d6] disabled:opacity-40" disabled={answer === undefined} onClick={submit} type="button">
                {guidedAction ? (answer === undefined ? guidedAction.pendingLabel : '继续课程') : '提交答案'}
              </button>
            </div>
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
      <RestartDialog onCancel={() => setRestartOpen(false)} onConfirm={restartLesson} open={restartOpen} />
    </main>
  );
}
