import Dexie, { type EntityTable } from 'dexie';

import type { Composition } from '../domain/music/types';

export type StarRating = 0 | 1 | 2 | 3;

export type ProgressRecord = {
  id: 'local';
  xp: number;
  streak: number;
  lastStudyDate?: string;
  stars: Record<string, StarRating>;
  unlockedLessonIds: string[];
};

export type AttemptRecord = {
  id: string;
  lessonId: string;
  skillIds: string[];
  correct: boolean;
  hints: number;
  errorCode?: string;
  createdAt: string;
};

export type ReviewRecord = {
  skillId: string;
  mastery: number;
  intervalDays: 1 | 3 | 7 | 14;
  dueAt: string;
  consecutiveCorrect: number;
};

export type CompositionRecord = Composition & {
  createdAt: string;
  updatedAt: string;
  revision: number;
};

export type SettingRecord = { key: string; value: unknown };

class MusicStudyDatabase extends Dexie {
  progress!: EntityTable<ProgressRecord, 'id'>;
  attempts!: EntityTable<AttemptRecord, 'id'>;
  reviews!: EntityTable<ReviewRecord, 'skillId'>;
  compositions!: EntityTable<CompositionRecord, 'id'>;
  settings!: EntityTable<SettingRecord, 'key'>;

  constructor() {
    super('music-study');
    this.version(1).stores({
      progress: '&id',
      attempts: '&id, lessonId, *skillIds, createdAt',
      reviews: '&skillId, dueAt',
      compositions: '&id, updatedAt',
      settings: '&key',
    });
  }
}

export const db = new MusicStudyDatabase();
