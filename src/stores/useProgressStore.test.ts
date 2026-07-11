import { db } from '../data/db';
import { useProgressStore } from './useProgressStore';

describe('useProgressStore', () => {
  it('surfaces hydration rejection instead of remaining in loading state', async () => {
    vi.spyOn(db.progress, 'get').mockRejectedValueOnce(new Error('read failed'));
    await useProgressStore.getState().hydrate();
    expect((useProgressStore.getState() as unknown as { hydrationError?: Error }).hydrationError?.message).toBe('read failed');
  });
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useProgressStore.setState({
      hydrated: false,
      progress: { id: 'local', xp: 0, streak: 0, stars: {}, unlockedLessonIds: [] },
    });
  });

  afterAll(async () => {
    await db.delete();
  });

  it('hydrates persisted progress', async () => {
    await db.progress.put({
      id: 'local',
      xp: 25,
      streak: 2,
      stars: { 'pitch-01': 2 },
      unlockedLessonIds: ['pitch-02'],
    });

    await useProgressStore.getState().hydrate();

    expect(useProgressStore.getState()).toMatchObject({
      hydrated: true,
      progress: { xp: 25, streak: 2, stars: { 'pitch-01': 2 } },
    });
  });

  it('refreshes progress after completing a lesson', async () => {
    await useProgressStore.getState().completeLesson({
      lessonId: 'pitch-01',
      score: 90,
      hints: 0,
      completedVariant: false,
    });

    expect(useProgressStore.getState().progress.stars['pitch-01']).toBe(2);
  });

  it('records an attempt without changing the progress snapshot', async () => {
    await useProgressStore.getState().recordAttempt({
      lessonId: 'pitch-01',
      skillIds: ['pitch'],
      correct: false,
      hints: 1,
      errorCode: 'flat',
    });

    expect(await db.attempts.count()).toBe(1);
    expect(useProgressStore.getState().progress.xp).toBe(0);
  });
});
