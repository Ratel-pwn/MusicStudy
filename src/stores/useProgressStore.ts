import { create } from 'zustand';

import type { AttemptRecord, ProgressRecord } from '../data/db';
import {
  attemptRepository,
  progressRepository,
  type CompleteLessonInput,
} from '../data/repositories';

export type ProgressState = {
  hydrated: boolean;
  hydrationError: Error | null;
  progress: ProgressRecord;
  hydrate(): Promise<void>;
  completeLesson(input: CompleteLessonInput): Promise<void>;
  recordAttempt(input: Omit<AttemptRecord, 'id' | 'createdAt'>): Promise<void>;
};

const initialProgress: ProgressRecord = {
  id: 'local',
  xp: 0,
  streak: 0,
  stars: {},
  unlockedLessonIds: [],
  badgeIds: [],
};

export const useProgressStore = create<ProgressState>((set) => ({
  hydrated: false,
  hydrationError: null,
  progress: initialProgress,

  async hydrate() {
    try {
      const progress = await progressRepository.get();
      set({ hydrated: true, hydrationError: null, progress });
    } catch (reason) {
      set({ hydrationError: reason instanceof Error ? reason : new Error(String(reason)) });
    }
  },

  async completeLesson(input) {
    const progress = await progressRepository.completeLesson(input);
    set({ progress });
  },

  async recordAttempt(input) {
    await attemptRepository.record(input);
  },
}));
