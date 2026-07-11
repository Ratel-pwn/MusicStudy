import type { LessonStep } from '../../content/schema';
import { lessons } from '../../content/worlds';
import { getAudioChoiceCandidates } from './audioChoice';

const authoredAudioChoices = lessons
  .flatMap((lesson) => lesson.steps)
  .filter((step) => step.type === 'choice' && step.config.audioOptions !== undefined);

describe('audio choice candidates', () => {
  it('keeps a fixed candidate order for a known step', () => {
    const step: LessonStep = {
      id: 'fixed-audio',
      type: 'choice',
      prompt: 'Compare candidates.',
      skillIds: ['pitch'],
      config: {
        choices: ['升高', '降低', '不变'],
        answer: '升高',
        audioOptions: { 升高: ['C4', 'G4'], 降低: ['C4', 'F3'], 不变: ['C4', 'C4'] },
      },
      feedback: {},
    };

    expect(getAudioChoiceCandidates(step)).toEqual([
      { label: 'A', choice: '不变' },
      { label: 'B', choice: '升高' },
      { label: 'C', choice: '降低' },
    ]);
  });

  it('varies the visible position of correct answers across authored questions', () => {
    const correctPositions = authoredAudioChoices.map((step) => {
      const candidates = getAudioChoiceCandidates(step);
      return candidates.findIndex(({ choice }) => choice === step.config.answer);
    });

    expect(correctPositions).not.toContain(-1);
    expect(new Set(correctPositions).size).toBeGreaterThan(1);
  });

  it('uses anonymous A/B/C labels without exposing authored answer text', () => {
    for (const step of authoredAudioChoices) {
      const choices = step.config.choices as unknown[];
      const candidates = getAudioChoiceCandidates(step);

      expect(candidates.map(({ label }) => label)).toEqual(['A', 'B', 'C'].slice(0, choices.length));
      for (const candidate of candidates) {
        expect(candidate.label).not.toContain(String(candidate.choice));
        expect(String(candidate.choice)).not.toContain(candidate.label);
      }
      expect(candidates.map(({ choice }) => choice).sort()).toEqual([...choices].sort());
    }
  });

  it('preserves authored labels and order for choices without audio candidates', () => {
    const step: LessonStep = {
      id: 'text-choice',
      type: 'choice',
      prompt: 'Choose a written answer.',
      skillIds: ['pitch'],
      config: { choices: ['低音', '高音'], answer: '高音' },
      feedback: {},
    };

    expect(getAudioChoiceCandidates(step)).toEqual([
      { label: '低音', choice: '低音' },
      { label: '高音', choice: '高音' },
    ]);
  });

  it('rejects audio choice configs with more than three candidates', () => {
    const step: LessonStep = {
      id: 'too-many-audio-candidates',
      type: 'choice',
      prompt: 'Compare candidates.',
      skillIds: ['pitch'],
      config: {
        choices: ['一', '二', '三', '四'],
        answer: '一',
        audioOptions: { 一: ['C4'], 二: ['D4'], 三: ['E4'], 四: ['F4'] },
      },
      feedback: {},
    };

    expect(() => getAudioChoiceCandidates(step)).toThrow(/at most 3/i);
  });
});
