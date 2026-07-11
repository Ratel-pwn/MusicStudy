import { worlds } from '../../content/worlds';
import { calculateStars, unlockedLessonIds } from './progression';

describe('calculateStars', () => {
  it('reserves three stars for a positive migration or creative challenge', () => {
    expect(calculateStars({ score: 100, hints: 0, completedVariant: true })).toBe(2);
    expect(calculateStars({ score: 100, hints: 0, completedVariant: false, completedChallenge: true } as never)).toBe(3);
  });
  it.each([
    [{ score: 70, hints: 3, completedVariant: false }, 1],
    [{ score: 85, hints: 1, completedVariant: false }, 2],
    [{ score: 90, hints: 0, completedVariant: true }, 2],
    [{ score: 90, hints: 0, completedVariant: false, completedChallenge: true }, 3],
    [{ score: 90, hints: 0, completedVariant: false }, 2],
  ] as const)('returns the product-rule star rating for %o', (input, expected) => {
    expect(calculateStars(input)).toBe(expected);
  });
});

describe('unlockedLessonIds', () => {
  it('opens the next playable lesson after a starred lesson', () => {
    expect(unlockedLessonIds(worlds, { 'pitch-high-low': 1 })).toContain('pitch-middle-c');
  });

  it('opens the first lesson for a new learner and omits planned capability nodes', () => {
    const unlocked = unlockedLessonIds(worlds, {});

    expect(unlocked).toEqual(['pitch-high-low']);
    expect(unlocked).not.toContain('node-interval-shapes');
  });
});
