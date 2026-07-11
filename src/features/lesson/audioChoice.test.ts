import type { LessonStep } from '../../content/schema';
import { lessons } from '../../content/worlds';
import { getAudioChoiceCandidates } from './audioChoice';

const authoredAudioChoices = lessons
  .flatMap((lesson) => lesson.steps)
  .filter((step) => step.type === 'choice' && step.config.audioOptions !== undefined);

describe('audio choice candidates', () => {
  it('keeps candidate order stable for the same step', () => {
    const step = authoredAudioChoices[0];

    expect(getAudioChoiceCandidates(step)).toEqual(getAudioChoiceCandidates(step));
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
        expect(choices).not.toContain(candidate.label);
        expect(candidate.label).not.toContain(String(step.config.answer));
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
});
