import type { Lesson, LessonStep, SkillId } from './schema';

describe('course schema', () => {
  it('accepts the lesson contract used by playable curriculum', () => {
    const skills: SkillId[] = ['pitch', 'keyboard'];
    const step: LessonStep = {
      id: 'hear-middle-c',
      type: 'listen',
      prompt: '听中央 C 的位置与音色。',
      skillIds: skills,
      config: { notes: ['C4'] },
      feedback: { wrongOctave: '你选到了另一个 C；中央 C 位于键盘正中央附近。' },
    };
    const lesson: Lesson = {
      id: 'pitch-middle-c',
      worldId: 'foundation-pitch-island',
      title: '找到中央 C',
      order: 2,
      xp: 60,
      prerequisiteIds: ['pitch-high-low'],
      steps: [step],
    };

    expect(lesson.steps[0]).toBe(step);
  });
});
