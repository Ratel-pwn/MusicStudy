export type CalculateStarsInput = {
  score: number;
  hints: number;
  completedVariant: boolean;
};

export const calculateStars = ({
  score,
  hints,
  completedVariant,
}: CalculateStarsInput): 1 | 2 | 3 => {
  const highQualityCompletion = score >= 90 && hints === 0;
  if (completedVariant && highQualityCompletion) return 3;
  if (score >= 80 && hints <= 1) return 2;
  return 1;
};
