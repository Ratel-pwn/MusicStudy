import type { SkillId } from '../../content/schema';
import type { AttemptRecord, ReviewRecord } from '../../data/db';
import { deriveWeakSkills } from '../practice/scheduler';
import type { SkillOrbitItem } from './SkillOrbit';

const orbitSkills: ReadonlyArray<Pick<SkillOrbitItem, 'id' | 'label' | 'recommendedPractice'>> = [
  { id: 'pitch', label: '音高', recommendedPractice: '高低音与中央 C 辨认' },
  { id: 'rhythm', label: '节奏', recommendedPractice: '四拍脉搏与八分细分' },
  { id: 'keyboard', label: '键盘', recommendedPractice: '白键定位' },
  { id: 'scale', label: '音阶', recommendedPractice: 'C 大调上行' },
  { id: 'chord', label: '和弦', recommendedPractice: 'C–E–G 堆叠' },
  { id: 'creation', label: '创作', recommendedPractice: '改写第八小节' },
];

export function buildSkillOrbitItems({
  attempts,
  reviews,
}: {
  attempts: readonly AttemptRecord[];
  reviews: readonly ReviewRecord[];
}): SkillOrbitItem[] {
  const masteryBySkill = new Map(deriveWeakSkills(attempts).map((skill) => [skill.skillId, skill.mastery]));
  const reviewBySkill = new Map(reviews.map((review) => [review.skillId, review]));
  const recentErrors = new Map<SkillId, string[]>();

  for (const attempt of [...attempts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    if (attempt.correct || !attempt.errorCode) continue;
    for (const skillId of attempt.skillIds) {
      const codes = recentErrors.get(skillId) ?? [];
      if (!codes.includes(attempt.errorCode) && codes.length < 3) codes.push(attempt.errorCode);
      recentErrors.set(skillId, codes);
    }
  }

  return orbitSkills.map((skill) => {
    const review = reviewBySkill.get(skill.id);
    return {
      ...skill,
      mastery: review?.mastery ?? masteryBySkill.get(skill.id) ?? 0,
      dueAt: review?.dueAt,
      recentErrors: recentErrors.get(skill.id) ?? [],
    };
  });
}
