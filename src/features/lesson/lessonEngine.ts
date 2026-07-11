import type { Lesson, LessonStep } from '../../content/schema';
import { buildTriad } from '../../domain/music/chords';
import { parseNote } from '../../domain/music/pitch';
import { buildScale } from '../../domain/music/scales';
import type { NoteName, ScaleKind, TriadQuality } from '../../domain/music/types';
import { calculateStars } from '../map/progression';

export type FeedbackResult = {
  correct: boolean;
  level: 0 | 1 | 2 | 3;
  message?: string;
  errorCode?: string;
};

export type LessonSession = {
  lessonId: string;
  stepIndex: number;
  correctCount: number;
  attempts: number;
  hintLevel: 0 | 1 | 2 | 3;
  requiresVariant: boolean;
  completedVariant: boolean;
  completedChallenge: boolean;
  hintsUsed: number;
  answers: Array<{ stepId: string; correct: boolean; errorCode?: string }>;
  steps: LessonStep[];
  variantStep?: LessonStep;
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

function midiLabel(midi: number): string {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function transposeNote(note: string, semitones: number): string {
  return midiLabel(parseNote(note).midi + semitones);
}

export function createLessonSession(lesson: Lesson): LessonSession {
  return {
    lessonId: lesson.id,
    stepIndex: 0,
    correctCount: 0,
    attempts: 0,
    hintLevel: 0,
    requiresVariant: false,
    completedVariant: false,
    completedChallenge: false,
    hintsUsed: 0,
    answers: [],
    steps: lesson.steps,
  };
}

function tapCount(step: LessonStep): number {
  if (Array.isArray(step.config.pattern)) return step.config.pattern.length;
  if (typeof step.config.taps === 'number') return step.config.taps;
  if (typeof step.config.bars === 'number') return step.config.bars;
  return 0;
}

export function getExpectedAnswer(step: LessonStep): unknown {
  const config = step.config;
  if ('answer' in config) return config.answer;
  if ('target' in config) {
    return typeof config.repetitions === 'number'
      ? Array(config.repetitions).fill(config.target)
      : config.target;
  }
  if ('sequence' in config) return config.sequence;
  if ('notes' in config) return config.notes;
  if ('arpeggio' in config) return config.arpeggio;
  if (step.type === 'rhythmTap') return Array(tapCount(step)).fill(1);
  if ('units' in config) return config.units;
  if (step.type === 'rhythmBuild' && typeof config.bars === 'number') {
    return Array(config.bars).fill('bar');
  }
  if (step.type === 'scaleBuild') {
    const root = config.root as NoteName;
    return [...buildScale(root, config.kind as ScaleKind), root];
  }
  if (step.type === 'chordBuild') {
    return buildTriad(config.root as NoteName, config.quality as TriadQuality);
  }
  if (step.type === 'keyboard' && typeof config.anchor === 'string') {
    const anchor = config.anchor;
    return [anchor, transposeNote(anchor, 12), transposeNote(anchor, -12)];
  }
  if (Array.isArray(config.choices)) return config.choices[0];
  return true;
}

function makeDifferentSequence(sequence: string[]): string[] {
  const reversed = [...sequence].reverse();
  return JSON.stringify(reversed) === JSON.stringify(sequence)
    ? sequence.map((note, index) => index === 0 ? transposeNote(note, 1) : note)
    : reversed;
}

function createVariant(step: LessonStep): LessonStep {
  const config = { ...step.config };
  if (step.type === 'keyboard') {
    if (typeof config.target === 'string') config.target = transposeNote(config.target, 1);
    else if (Array.isArray(config.sequence)) config.sequence = makeDifferentSequence(config.sequence as string[]);
    else if (Array.isArray(config.notes)) config.notes = makeDifferentSequence(config.notes as string[]);
    else config.answer = ['C4', 'C3', 'C5'];
  } else if (step.type === 'rhythmTap') {
    config.taps = Math.max(1, tapCount(step) + 1);
    delete config.pattern;
  } else if (step.type === 'rhythmBuild') {
    if (Array.isArray(config.units)) {
      const units = [...config.units] as string[];
      units[0] = units[0] === 'quarter' ? 'eighth' : 'quarter';
      config.units = units;
    } else {
      config.answer = [...(getExpectedAnswer(step) as string[]), 'variation'];
    }
  } else if (step.type === 'scaleBuild') {
    config.root = config.root === 'C' ? 'D' : 'C';
  } else if (step.type === 'chordBuild') {
    config.quality = config.quality === 'major' ? 'minor' : 'major';
  } else if (step.type === 'choice') {
    const choices = config.choices as unknown[] | undefined;
    const original = getExpectedAnswer(step);
    config.answer = choices?.find((choice) => choice !== original) ?? `${String(original)} · 变式`;
  }
  return {
    ...step,
    id: `${step.id}--variant`,
    prompt: `${step.prompt}（变式）`,
    config,
  };
}

export function getCurrentStep(session: LessonSession): LessonStep {
  const step = session.variantStep ?? session.steps[session.stepIndex];
  if (!step) throw new Error('Lesson session is complete');
  return step;
}

function answersMatch(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

type ListeningAnswer = { listened: true; sampleCount: number };
type StudioTransferAnswer = { applied: true; compositionId: string; trackActions: string[] };

function validateRhythmTaps(step: LessonStep, answer: unknown): boolean {
  const hasAccents = Array.isArray(step.config.accents);
  if (!answer || typeof answer !== 'object') return false;
  const timestamps = (answer as { timestamps?: unknown }).timestamps;
  const targetTimestamps = (answer as { targetTimestamps?: unknown }).targetTimestamps;
  if (!Array.isArray(timestamps) || !timestamps.every((value) => typeof value === 'number')) return false;
  if (!Array.isArray(targetTimestamps) || !targetTimestamps.every((value) => typeof value === 'number')) return false;
  const count = tapCount(step);
  if (timestamps.length !== count || targetTimestamps.length !== count || count < 1) return false;
  const timingCorrect = timestamps.every((time, index) => Math.abs((time as number) - (targetTimestamps[index] as number)) <= 120);
  if (!timingCorrect || !hasAccents) return timingCorrect;
  return answersMatch((answer as { accents?: unknown }).accents, step.config.accents);
}

function validateEightBarStructure(answer: unknown): boolean {
  if (!answer || typeof answer !== 'object') return false;
  const bars = (answer as { bars?: unknown }).bars;
  return Array.isArray(bars)
    && bars.length === 8
    && bars.every((bar) => typeof bar === 'string' && bar.length > 0)
    && bars[7] !== bars[3];
}

function validateStudioTransfer(step: LessonStep, answer: unknown): boolean {
  if (!answer || typeof answer !== 'object') return false;
  const transfer = answer as Partial<StudioTransferAnswer>;
  if (transfer.applied !== true || typeof transfer.compositionId !== 'string' || !Array.isArray(transfer.trackActions)) return false;
  const requiredTracks = Array.isArray(step.config.requiredTracks)
    ? step.config.requiredTracks.filter((track): track is string => typeof track === 'string')
    : typeof step.config.targetTrack === 'string' ? [step.config.targetTrack] : [];
  return requiredTracks.every((track) => transfer.trackActions?.includes(track));
}

export function validateStepAnswer(step: LessonStep, answer: unknown): boolean {
  if (step.type === 'listen') {
    const listening = answer as Partial<ListeningAnswer> | null;
    return listening?.listened === true && typeof listening.sampleCount === 'number' && listening.sampleCount > 0;
  }
  if (step.type === 'rhythmTap') return validateRhythmTaps(step, answer);
  if (step.type === 'rhythmBuild' && typeof step.config.bars === 'number' && !Array.isArray(step.config.units)) {
    return validateEightBarStructure(answer);
  }
  if (step.type === 'studioTransfer') return validateStudioTransfer(step, answer);
  return answersMatch(answer, getExpectedAnswer(step));
}

function wrongAnswersForCurrentStep(session: LessonSession, stepId: string): number {
  let count = 0;
  for (let index = session.answers.length - 1; index >= 0; index -= 1) {
    const answer = session.answers[index];
    if (answer.stepId !== stepId) break;
    if (!answer.correct) count += 1;
  }
  return count;
}

export function submitAnswer(
  session: LessonSession,
  answer: unknown,
): { session: LessonSession; feedback: FeedbackResult } {
  if (session.stepIndex >= session.steps.length) {
    return { session, feedback: { correct: true, level: 0 } };
  }
  const step = getCurrentStep(session);
  const correct = validateStepAnswer(step, answer);
  const errorCode = correct ? undefined : Object.keys(step.feedback)[0];
  const answerRecord = { stepId: step.id, correct, ...(errorCode ? { errorCode } : {}) };

  if (correct) {
    const completedVariant = Boolean(session.variantStep);
    return {
      session: {
        ...session,
        stepIndex: session.stepIndex + 1,
        correctCount: session.correctCount + 1,
        attempts: session.attempts + 1,
        hintLevel: 0,
        completedVariant: session.completedVariant || completedVariant,
        completedChallenge: session.completedChallenge || step.type === 'studioTransfer',
        requiresVariant: false,
        variantStep: undefined,
        answers: [...session.answers, answerRecord],
      },
      feedback: { correct: true, level: 0 },
    };
  }

  const level = Math.min(3, wrongAnswersForCurrentStep(session, step.id) + 1) as 1 | 2 | 3;
  const switchToVariant = !session.variantStep && level === 3;
  return {
    session: {
      ...session,
      attempts: session.attempts + 1,
      requiresVariant: session.requiresVariant || switchToVariant,
      variantStep: switchToVariant ? createVariant(step) : session.variantStep,
      answers: [...session.answers, answerRecord],
    },
    feedback: {
      correct: false,
      level,
      errorCode,
      message: errorCode ? step.feedback[errorCode] : undefined,
    },
  };
}

export function requestHint(session: LessonSession): LessonSession {
  return {
    ...session,
    hintLevel: Math.min(3, session.hintLevel + 1) as 0 | 1 | 2 | 3,
    hintsUsed: session.hintsUsed + (session.hintLevel < 3 ? 1 : 0),
  };
}

export function getHint(session: LessonSession): string {
  const step = getCurrentStep(session);
  const expected = getExpectedAnswer(step);
  if (session.hintLevel <= 1) {
    return `方向：${Object.values(step.feedback)[0] ?? '先确认题目要求的移动方向。'}`;
  }
  if (session.hintLevel === 2) {
    const size = Array.isArray(expected) ? expected.length : 1;
    return `结构：答案包含 ${size} 个位置，先完成最确定的部分。`;
  }
  return `演示答案：${Array.isArray(expected) ? expected.join(' → ') : String(expected)}`;
}

export function scoreLesson(session: LessonSession): { score: number; stars: 1 | 2 | 3 } {
  const errors = session.attempts - session.correctCount;
  const score = Math.max(0, 100 - errors * 15 - session.hintsUsed * 5);
  const stars = calculateStars({
    score,
    hints: session.hintsUsed,
    completedVariant: session.completedVariant,
    completedChallenge: session.completedChallenge,
  });
  return { score, stars };
}
