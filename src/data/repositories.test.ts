import type { Composition } from '../domain/music/types';
import {
  attemptRepository,
  compositionRepository,
  progressRepository,
  reviewRepository,
} from './repositories';
import { db } from './db';

const composition: Composition = {
  id: 'composition-1',
  title: 'First sketch',
  bpm: 96,
  key: 'C-major',
  bars: 8,
  tracks: { drums: [], bass: [], chords: [], melody: [] },
};

describe('local repositories', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterAll(async () => {
    await db.delete();
  });

  it('returns default progress for an empty database', async () => {
    await expect(progressRepository.get()).resolves.toEqual({
      id: 'local',
      xp: 0,
      streak: 0,
      stars: {},
      unlockedLessonIds: [],
    });
  });

  it('completes a lesson and keeps the best star result', async () => {
    await progressRepository.completeLesson({
      lessonId: 'pitch-01',
      score: 90,
      hints: 0,
      completedVariant: false,
    });
    expect((await progressRepository.get()).stars['pitch-01']).toBe(2);

    await progressRepository.completeLesson({
      lessonId: 'pitch-01',
      score: 90,
      hints: 0,
      completedVariant: true,
    });
    await progressRepository.completeLesson({
      lessonId: 'pitch-01',
      score: 40,
      hints: 2,
      completedVariant: false,
    });

    const progress = await progressRepository.get();
    expect(progress.stars['pitch-01']).toBe(3);
  });

  it('saves, reads, and overwrites a composition while updating revision metadata', async () => {
    const first = await compositionRepository.save(composition);
    expect(first).toEqual(composition);
    expect(await compositionRepository.get(composition.id)).toEqual(composition);
    const firstRecord = await db.compositions.get(composition.id);
    expect(firstRecord).toMatchObject({ ...composition, revision: 1 });

    const updated = await compositionRepository.save({ ...composition, title: 'Second sketch' });
    expect(updated).toEqual({ ...composition, title: 'Second sketch' });
    expect(await compositionRepository.get(composition.id)).toEqual(updated);
    const updatedRecord = await db.compositions.get(composition.id);
    expect(updatedRecord).toMatchObject({ title: 'Second sketch', revision: 2 });
    expect(updatedRecord?.createdAt).toBe(firstRecord?.createdAt);
  });

  it('records attempts with generated identity and timestamp', async () => {
    const saved = await attemptRepository.record({
      lessonId: 'pitch-01',
      skillIds: ['pitch'],
      correct: true,
      hints: 0,
    });

    expect(saved).toMatchObject({ lessonId: 'pitch-01', correct: true });
    expect(saved.id).toEqual(expect.any(String));
    expect(saved.createdAt).toEqual(expect.any(String));
    expect(await db.attempts.get(saved.id)).toEqual(saved);
  });

  it('reads recent persisted attempts newest first with an optional limit', async () => {
    await db.attempts.bulkAdd([
      { id: 'old', lessonId: 'pitch-01', skillIds: ['pitch'], correct: false, hints: 0, errorCode: 'wrong-octave', createdAt: '2026-07-09T08:00:00.000Z' },
      { id: 'new', lessonId: 'rhythm-01', skillIds: ['rhythm'], correct: true, hints: 1, createdAt: '2026-07-11T08:00:00.000Z' },
      { id: 'middle', lessonId: 'chord-01', skillIds: ['chord', 'pitch'], correct: false, hints: 2, errorCode: 'wrong-third', createdAt: '2026-07-10T08:00:00.000Z' },
    ]);

    await expect(attemptRepository.recent(2)).resolves.toEqual([
      expect.objectContaining({ id: 'new' }),
      expect.objectContaining({ id: 'middle' }),
    ]);
    await expect(attemptRepository.recent()).resolves.toHaveLength(3);
  });

  it('lists review records and filters the reviews due by a given time', async () => {
    await db.reviews.bulkPut([
      { skillId: 'pitch', mastery: 48, intervalDays: 1, dueAt: '2026-07-10T00:00:00.000Z', consecutiveCorrect: 0 },
      { skillId: 'rhythm', mastery: 72, intervalDays: 3, dueAt: '2026-07-14T00:00:00.000Z', consecutiveCorrect: 2 },
    ]);

    await expect(reviewRepository.all()).resolves.toHaveLength(2);
    await expect(reviewRepository.due(new Date('2026-07-11T00:00:00.000Z'))).resolves.toEqual([
      expect.objectContaining({ skillId: 'pitch' }),
    ]);
  });

  it('returns the most recently updated composition for the home continuation', async () => {
    await compositionRepository.save({ ...composition, id: 'older', title: '旧作品' });
    await new Promise((resolve) => setTimeout(resolve, 2));
    await compositionRepository.save({ ...composition, id: 'newer', title: '港湾灯火' });

    await expect(compositionRepository.recent()).resolves.toEqual(
      expect.objectContaining({ id: 'newer', title: '港湾灯火' }),
    );
  });
});
