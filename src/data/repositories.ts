import type { Composition } from '../domain/music/types';
import type { SkillId } from '../content/schema';
import { calculateStars } from '../features/map/progression';
import {
  db,
  type AttemptRecord,
  type CompositionRecord,
  type ProgressRecord,
  type ReviewRecord,
  type StarRating,
} from './db';
import { scheduleReview, type ReviewResult } from '../features/practice/scheduler';

export type CompleteLessonInput = {
  lessonId: string;
  score: number;
  hints: number;
  completedVariant: boolean;
};
export type NewAttempt = Omit<AttemptRecord, 'id' | 'createdAt'>;

const defaultProgress = (): ProgressRecord => ({
  id: 'local',
  xp: 0,
  streak: 0,
  stars: {},
  unlockedLessonIds: [],
});

export const progressRepository = {
  async get(): Promise<ProgressRecord> {
    return (await db.progress.get('local')) ?? defaultProgress();
  },

  async completeLesson(input: CompleteLessonInput): Promise<ProgressRecord> {
    return db.transaction('rw', db.progress, async () => {
      const current = await this.get();
      const nextStars = Math.max(
        current.stars[input.lessonId] ?? 0,
        calculateStars(input),
      ) as StarRating;
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

  async recent(limit?: number): Promise<AttemptRecord[]> {
    const recent = db.attempts.orderBy('createdAt').reverse();
    return limit === undefined
      ? recent.toArray()
      : recent.limit(Math.max(0, Math.floor(limit))).toArray();
  },
};

export type CompleteReviewInput = {
  skillId: SkillId;
  result: ReviewResult;
  completedAt?: Date;
  current?: ReviewRecord;
  initialMastery?: number;
};

export const reviewRepository = {
  async complete(input: CompleteReviewInput): Promise<ReviewRecord> {
    return db.transaction('rw', db.reviews, async () => {
      const completedAt = input.completedAt ?? new Date();
      const current = (await db.reviews.get(input.skillId)) ?? input.current ?? {
        skillId: input.skillId,
        mastery: input.initialMastery ?? 0,
        intervalDays: 1,
        dueAt: completedAt.toISOString(),
        consecutiveCorrect: 0,
      };
      const next = scheduleReview(current, input.result, completedAt);
      await db.reviews.put(next);
      return next;
    });
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
