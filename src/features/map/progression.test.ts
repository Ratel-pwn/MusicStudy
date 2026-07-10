import { calculateStars } from './progression';

describe('calculateStars', () => {
  it.each([
    [{ score: 70, hints: 3, completedVariant: false }, 1],
    [{ score: 85, hints: 1, completedVariant: false }, 2],
    [{ score: 90, hints: 0, completedVariant: true }, 3],
    [{ score: 90, hints: 0, completedVariant: false }, 2],
  ] as const)('returns the product-rule star rating for %o', (input, expected) => {
    expect(calculateStars(input)).toBe(expected);
  });
});
