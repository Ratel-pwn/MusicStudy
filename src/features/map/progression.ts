import type { CourseWorld } from '../../content/schema';

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

export type LessonStars = Readonly<Record<string, number>>;

export const unlockedLessonIds = (
  worlds: readonly CourseWorld[],
  stars: LessonStars,
): string[] => {
  const playableLessonIds = [...worlds]
    .sort((a, b) => a.order - b.order)
    .flatMap((world) => world.nodes)
    .flatMap((node) => node.availability === 'playable' && node.lessonId ? [node.lessonId] : []);

  if (playableLessonIds.length === 0) return [];

  const unlocked = new Set<string>([playableLessonIds[0]]);
  playableLessonIds.forEach((lessonId, index) => {
    if ((stars[lessonId] ?? 0) <= 0) return;
    unlocked.add(lessonId);
    const nextLessonId = playableLessonIds[index + 1];
    if (nextLessonId) unlocked.add(nextLessonId);
  });

  return playableLessonIds.filter((lessonId) => unlocked.has(lessonId));
};
