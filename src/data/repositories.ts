import type { Composition } from '../domain/music/types';
import {
  db,
  type AttemptRecord,
  type CompositionRecord,
  type ProgressRecord,
  type StarRating,
} from './db';

export type CompleteLessonInput = { lessonId: string; score: number; hints: number };
export type NewAttempt = Omit<AttemptRecord, 'id' | 'createdAt'>;

const defaultProgress = (): ProgressRecord => ({
  id: 'local',
  xp: 0,
  streak: 0,
  stars: {},
  unlockedLessonIds: [],
});

// Temporary private policy until the progression domain owns this calculation.
const lessonStars = ({ score, hints }: CompleteLessonInput): StarRating => {
  if (score >= 90 && hints === 0) return 3;
  if (score >= 70) return 2;
  if (score > 0) return 1;
  return 0;
};

export const progressRepository = {
  async get(): Promise<ProgressRecord> {
    return (await db.progress.get('local')) ?? defaultProgress();
  },

  async completeLesson(input: CompleteLessonInput): Promise<ProgressRecord> {
    return db.transaction('rw', db.progress, async () => {
      const current = await this.get();
      const nextStars = Math.max(current.stars[input.lessonId] ?? 0, lessonStars(input)) as StarRating;
      const next: ProgressRecord = {
        ...current,
        stars: { ...current.stars, [input.lessonId]: nextStars },
      };
      await db.progress.put(next);
      return next;
    });
  },
};

export const attemptRepository = {
  async record(input: NewAttempt): Promise<AttemptRecord> {
    const record: AttemptRecord = {
      ...input,
      id: globalThis.crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await db.attempts.add(record);
    return record;
  },
};

const toComposition = ({ createdAt: _createdAt, updatedAt: _updatedAt, revision: _revision, ...composition }: CompositionRecord): Composition => composition;

export const compositionRepository = {
  async save(composition: Composition): Promise<Composition> {
    await db.transaction('rw', db.compositions, async () => {
      const existing = await db.compositions.get(composition.id);
      const now = new Date().toISOString();
      await db.compositions.put({
        ...composition,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        revision: (existing?.revision ?? 0) + 1,
      });
    });
    return composition;
  },

  async get(id: string): Promise<Composition | undefined> {
    const record = await db.compositions.get(id);
    return record ? toComposition(record) : undefined;
  },
};
