import type { AttemptRecord, ReviewRecord } from '../../data/db';
import type { SkillId } from '../../content/schema';
import type { CompositionIssue } from '../../domain/music/types';

export type ReviewResult = { correct: boolean; hints: number };
export type WeakSkill = {
  skillId: SkillId;
  mastery: number;
  correctRate?: number;
  errorCount?: number;
  hintCount?: number;
  recentErrorCode?: string;
};

export type PracticeItem =
  | { id: string; source: 'due'; skillId: SkillId; review: ReviewRecord }
  | { id: string; source: 'weak'; skillId: SkillId; mastery: number }
  | { id: string; source: 'composition'; issue: CompositionIssue };

const intervals = [1, 3, 7, 14] as const;

export function scheduleReview(
  current: ReviewRecord,
  result: ReviewResult,
  completedAt = new Date(),
): ReviewRecord {
  const clean = result.correct && result.hints === 0;
  const currentIndex = intervals.indexOf(current.intervalDays);
  const intervalDays = clean
    ? intervals[Math.min(intervals.length - 1, currentIndex + 1)]
    : 1;
  const dueAt = new Date(completedAt);
  dueAt.setUTCDate(dueAt.getUTCDate() + intervalDays);

  return {
    ...current,
    mastery: Math.max(0, Math.min(100, current.mastery + (clean ? 12 : -10))),
    intervalDays,
    dueAt: dueAt.toISOString(),
    consecutiveCorrect: clean ? current.consecutiveCorrect + 1 : 0,
  };
}

type DailyPracticeInput = {
  dueReviews: readonly ReviewRecord[];
  weakSkills: readonly WeakSkill[];
  compositionIssues: readonly CompositionIssue[];
  limit?: number;
};

type WeakSkillAccumulator = {
  skillId: SkillId;
  total: number;
  correct: number;
  errorCount: number;
  hintCount: number;
  recentErrorCode?: string;
  recentErrorAt?: string;
};

export function deriveWeakSkills(attempts: readonly AttemptRecord[]): WeakSkill[] {
  const bySkill = new Map<SkillId, WeakSkillAccumulator>();

  for (const attempt of attempts) {
    for (const skillId of attempt.skillIds) {
      const current = bySkill.get(skillId) ?? {
        skillId,
        total: 0,
        correct: 0,
        errorCount: 0,
        hintCount: 0,
      };
      current.total += 1;
      current.correct += attempt.correct ? 1 : 0;
      current.errorCount += attempt.correct ? 0 : 1;
      current.hintCount += attempt.hints;
      if (!attempt.correct && attempt.errorCode && (!current.recentErrorAt || attempt.createdAt > current.recentErrorAt)) {
        current.recentErrorCode = attempt.errorCode;
        current.recentErrorAt = attempt.createdAt;
      }
      bySkill.set(skillId, current);
    }
  }

  return [...bySkill.values()]
    .map(({ skillId, total, correct, errorCount, hintCount, recentErrorCode }) => {
      const correctRate = total === 0 ? 0 : correct / total;
      const mastery = Math.max(0, Math.min(100, Math.round(correctRate * 100 - (hintCount / total) * 5)));
      return { skillId, mastery, correctRate, errorCount, hintCount, recentErrorCode };
    })
    .sort((a, b) => a.mastery - b.mastery
      || (b.errorCount ?? 0) - (a.errorCount ?? 0)
      || (b.hintCount ?? 0) - (a.hintCount ?? 0)
      || a.skillId.localeCompare(b.skillId));
}

export function buildDailyPracticeFromAttempts(input: {
  dueReviews: readonly ReviewRecord[];
  attempts: readonly AttemptRecord[];
  compositionIssues: readonly CompositionIssue[];
  limit?: number;
}): PracticeItem[] {
  return buildDailyPractice({
    dueReviews: input.dueReviews,
    weakSkills: deriveWeakSkills(input.attempts),
    compositionIssues: input.compositionIssues,
    limit: input.limit,
  });
}

export function buildDailyPractice({
  dueReviews,
  weakSkills,
  compositionIssues,
  limit = 6,
}: DailyPracticeInput): PracticeItem[] {
  const due = [...dueReviews]
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .map((review) => ({ id: `due:${review.skillId}`, source: 'due' as const, skillId: review.skillId, review }));
  const weak = [...weakSkills]
    .sort((a, b) => a.mastery - b.mastery)
    .map((skill) => ({ id: `weak:${skill.skillId}`, source: 'weak' as const, ...skill }));
  const composition = compositionIssues.map((issue, index) => ({
    id: `composition:${issue.code}:${index}`,
    source: 'composition' as const,
    issue,
  }));

  const selected = [
    ...due.splice(0, 3),
    ...weak.splice(0, 2),
    ...composition.splice(0, 1),
  ].slice(0, limit);
  const remaining = [...due, ...weak, ...composition];

  return [...selected, ...remaining.slice(0, Math.max(0, limit - selected.length))];
}
