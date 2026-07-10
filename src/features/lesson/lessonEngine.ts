import type { Lesson, LessonStep } from '../../content/schema';
import { buildTriad } from '../../domain/music/chords';
import { buildScale } from '../../domain/music/scales';
import type { NoteName, ScaleKind, TriadQuality } from '../../domain/music/types';

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
  hintsUsed: number;
  answers: Array<{ stepId: string; correct: boolean; errorCode?: string }>;
  steps: LessonStep[];
};

export function createLessonSession(lesson: Lesson): LessonSession {
  return {
    lessonId: lesson.id,
    stepIndex: 0,
    correctCount: 0,
    attempts: 0,
    hintLevel: 0,
    requiresVariant: false,
    completedVariant: false,
    hintsUsed: 0,
    answers: [],
    steps: lesson.steps,
  };
}

function expectedAnswer(step: LessonStep): unknown {
  const config = step.config;
  if ('answer' in config) return config.answer;
  if ('target' in config) return config.target;
  if ('sequence' in config) return config.sequence;
  if ('notes' in config) return config.notes;
  if ('arpeggio' in config) return config.arpeggio;
  if ('pattern' in config) return config.pattern;
  if ('units' in config) return config.units;
  if (step.type === 'scaleBuild') {
    return buildScale(config.root as NoteName, config.kind as ScaleKind);
  }
  if (step.type === 'chordBuild') {
    return buildTriad(config.root as NoteName, config.quality as TriadQuality);
  }
  return true;
}

function answersMatch(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function isCorrectAnswer(step: LessonStep, actual: unknown): boolean {
  if (!('answer' in step.config) && Array.isArray(step.config.choices)) {
    return step.config.choices.includes(actual);
  }
  return answersMatch(actual, expectedAnswer(step));
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
  const step = session.steps[session.stepIndex];
  if (!step) {
    return { session, feedback: { correct: true, level: 0 } };
  }

  const correct = isCorrectAnswer(step, answer);
  const errorCode = correct ? undefined : Object.keys(step.feedback)[0];
  const answerRecord = { stepId: step.id, correct, ...(errorCode ? { errorCode } : {}) };

  if (correct) {
    return {
      session: {
        ...session,
        stepIndex: session.stepIndex + 1,
        correctCount: session.correctCount + 1,
        attempts: session.attempts + 1,
        hintLevel: 0,
        completedVariant: session.completedVariant || session.requiresVariant,
        requiresVariant: false,
        answers: [...session.answers, answerRecord],
      },
      feedback: { correct: true, level: 0 },
    };
  }

  const level = Math.min(3, wrongAnswersForCurrentStep(session, step.id) + 1) as 1 | 2 | 3;
  return {
    session: {
      ...session,
      attempts: session.attempts + 1,
      requiresVariant: session.requiresVariant || level === 3,
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

export function scoreLesson(session: LessonSession): { score: number; stars: 1 | 2 | 3 } {
  const errors = session.attempts - session.correctCount;
  const score = Math.max(0, 100 - errors * 15 - session.hintsUsed * 5);
  const stars = score >= 85 ? 3 : score >= 60 ? 2 : 1;
  return { score, stars };
}
