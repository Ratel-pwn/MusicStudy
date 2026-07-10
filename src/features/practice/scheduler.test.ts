import { db, type AttemptRecord, type ReviewRecord } from '../../data/db';
import { attemptRepository } from '../../data/repositories';
import type { CompositionIssue } from '../../domain/music/types';
import { buildDailyPractice, buildDailyPracticeFromAttempts, deriveWeakSkills, scheduleReview } from './scheduler';

const base: ReviewRecord = {
  skillId: 'pitch',
  mastery: 28,
  intervalDays: 1,
  dueAt: '2026-07-11T00:00:00.000Z',
  consecutiveCorrect: 0,
};

describe('scheduleReview', () => {
  it('advances a clean answer through the 1, 3, 7, and 14 day intervals', () => {
    const day3 = scheduleReview(base, { correct: true, hints: 0 });
    const day7 = scheduleReview(day3, { correct: true, hints: 0 });
    const day14 = scheduleReview(day7, { correct: true, hints: 0 });

    expect(day3.intervalDays).toBe(3);
    expect(day7.intervalDays).toBe(7);
    expect(day14.intervalDays).toBe(14);
    expect(scheduleReview(day14, { correct: true, hints: 0 }).intervalDays).toBe(14);
  });

  it('returns to one day after an incorrect or hinted answer', () => {
    const day7 = { ...base, intervalDays: 7 as const, consecutiveCorrect: 2 };

    expect(scheduleReview(day7, { correct: false, hints: 1 }).intervalDays).toBe(1);
    expect(scheduleReview(day7, { correct: true, hints: 1 }).intervalDays).toBe(1);
  });

  it('updates mastery, streak, and due date without mutating the previous review', () => {
    const next = scheduleReview(base, { correct: true, hints: 0 }, new Date('2026-07-11T08:00:00.000Z'));

    expect(next).toMatchObject({ mastery: 40, consecutiveCorrect: 1, dueAt: '2026-07-14T08:00:00.000Z' });
    expect(base).toMatchObject({ mastery: 28, consecutiveCorrect: 0, dueAt: '2026-07-11T00:00:00.000Z' });
  });
});

describe('buildDailyPractice', () => {
  it('builds a six item plan from three due, two weak, and one composition task', () => {
    const skillIds = ['pitch', 'keyboard', 'notation', 'pulse', 'rhythm'] as const;
    const dueReviews = skillIds.map((skillId) => ({ ...base, skillId }));
    const weakSkills = ['creation', 'chord', 'scale', 'rhythm'].map((skillId, index) => ({ skillId, mastery: index * 10 })) as Array<{ skillId: 'creation' | 'chord' | 'scale' | 'rhythm'; mastery: number }>;
    const compositionIssues: CompositionIssue[] = [
      { code: 'empty-ending', message: '结尾还没有收束' },
      { code: 'thin-rhythm', message: '节奏层次偏少' },
    ];

    const plan = buildDailyPractice({ dueReviews, weakSkills, compositionIssues, limit: 6 });

    expect(plan.filter((item) => item.source === 'due')).toHaveLength(3);
    expect(plan.filter((item) => item.source === 'weak')).toHaveLength(2);
    expect(plan.filter((item) => item.source === 'composition')).toHaveLength(1);
    expect(plan).toHaveLength(6);
  });

  it('fills missing source quotas without exceeding the requested limit', () => {
    const plan = buildDailyPractice({
      dueReviews: [{ ...base, skillId: 'pulse' }],
      weakSkills: [{ skillId: 'pitch', mastery: 20 }, { skillId: 'rhythm', mastery: 30 }, { skillId: 'chord', mastery: 40 }],
      compositionIssues: [],
      limit: 4,
    });

    expect(plan.map((item) => item.source)).toEqual(['due', 'weak', 'weak', 'weak']);
  });
});

const persistedAttempts: AttemptRecord[] = [
  { id: 'pitch-correct', lessonId: 'pitch-01', skillIds: ['pitch', 'keyboard'], correct: true, hints: 1, createdAt: '2026-07-11T09:00:00.000Z' },
  { id: 'chord-wrong', lessonId: 'chord-01', skillIds: ['chord', 'pitch'], correct: false, hints: 2, errorCode: 'wrong-third', createdAt: '2026-07-11T08:00:00.000Z' },
  { id: 'rhythm-correct', lessonId: 'rhythm-01', skillIds: ['rhythm'], correct: true, hints: 0, createdAt: '2026-07-10T08:00:00.000Z' },
  { id: 'pitch-wrong', lessonId: 'pitch-02', skillIds: ['pitch'], correct: false, hints: 0, errorCode: 'wrong-octave', createdAt: '2026-07-09T08:00:00.000Z' },
];

describe('attempt-driven daily practice', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await db.attempts.bulkAdd(persistedAttempts);
  });

  afterAll(async () => {
    await db.delete();
  });

  it('derives stable weakest-first evidence from correct, wrong, hinted, and multi-skill attempts', async () => {
    const weak = deriveWeakSkills(await attemptRepository.recent());

    expect(weak.map((skill) => skill.skillId)).toEqual(['chord', 'pitch', 'keyboard', 'rhythm']);
    expect(weak[0]).toMatchObject({ correctRate: 0, errorCount: 1, hintCount: 2, recentErrorCode: 'wrong-third' });
    expect(weak[1]).toMatchObject({ correctRate: 1 / 3, errorCount: 2, hintCount: 3, recentErrorCode: 'wrong-third' });
  });

  it('builds the two weak tasks directly from persisted attempts without caller pre-aggregation', async () => {
    const plan = buildDailyPracticeFromAttempts({
      dueReviews: [base, { ...base, skillId: 'scale' }, { ...base, skillId: 'creation' }],
      attempts: await attemptRepository.recent(),
      compositionIssues: [{ code: 'open-ending', message: '结尾未收束' }],
      limit: 6,
    });

    expect(plan.filter((item) => item.source === 'weak').map((item) => item.source === 'weak' ? item.skillId : '')).toEqual(['chord', 'pitch']);
  });

  it('returns no weak evidence when no attempts exist', () => {
    expect(deriveWeakSkills([])).toEqual([]);
  });
});
