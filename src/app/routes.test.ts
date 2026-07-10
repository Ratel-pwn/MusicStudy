import * as routes from './routes';
import type { ProgressRecord } from '../data/db';
import type { Composition } from '../domain/music/types';
import { lessons } from '../content/worlds';

const emptyProgress: ProgressRecord = {
  id: 'local',
  xp: 0,
  streak: 0,
  stars: {},
  unlockedLessonIds: [],
};

const composition: Composition = {
  id: 'saved-piece',
  title: '潮汐草稿',
  bpm: 90,
  key: 'C-major',
  bars: 8,
  tracks: { drums: [], bass: [], chords: [], melody: [] },
};

function derive(input: unknown) {
  const candidate = Reflect.get(routes, 'deriveHomeRouteState') as ((value: unknown) => {
    returning: boolean;
    currentLessonId?: string;
    foundationComplete: boolean;
  }) | undefined;
  return candidate?.(input) ?? { returning: false, foundationComplete: false };
}

describe('home route state', () => {
  it.each([
    [{ ...emptyProgress, xp: 1 }, undefined, undefined],
    [{ ...emptyProgress, stars: { 'pitch-high-low': 1 } }, undefined, undefined],
    [emptyProgress, composition, undefined],
  ])('recognizes progress and persisted compositions as returning activity', (progress, recentComposition, storage) => {
    expect(derive({ progress, recentComposition, storage }).returning).toBe(true);
  });

  it('recognizes and resumes any unfinished lesson session from safe local storage', () => {
    const storage = {
      length: 1,
      key: () => 'musicstudy:lesson:pitch-middle-c',
      getItem: () => '{"lessonId":"pitch-middle-c","stepIndex":2}',
    };
    const state = derive({ progress: emptyProgress, recentComposition: undefined, storage });
    expect(state.returning).toBe(true);
    expect(state.currentLessonId).toBe('pitch-middle-c');
  });

  it('treats inaccessible local storage as empty activity', () => {
    const storage = {
      get length(): number { throw new DOMException('blocked'); },
      key: () => null,
      getItem: () => null,
    };
    expect(() => derive({ progress: emptyProgress, recentComposition: undefined, storage })).not.toThrow();
    expect(derive({ progress: emptyProgress, recentComposition: undefined, storage }).returning).toBe(false);
  });

  it('survives browsers that reject access to the localStorage property', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => { throw new DOMException('blocked', 'SecurityError'); },
    });
    try {
      expect(() => derive({ progress: emptyProgress, recentComposition: undefined })).not.toThrow();
    } finally {
      if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    }
  });

  it('marks the foundation complete without falling back to the first lesson', () => {
    const stars = Object.fromEntries(lessons.map((lesson) => [lesson.id, 1])) as ProgressRecord['stars'];
    const state = derive({ progress: { ...emptyProgress, stars }, recentComposition: undefined, storage: undefined });
    expect(state.foundationComplete).toBe(true);
    expect(state.currentLessonId).toBeUndefined();
  });
});
