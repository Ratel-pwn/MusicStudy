import type { Lesson } from '../../content/schema';
import {
  createLessonSession,
  getCurrentStep,
  getHint,
  getExpectedAnswer,
  requestHint,
  scoreLesson,
  submitAnswer,
} from './lessonEngine';

const lesson: Lesson = {
  id: 'engine-test',
  worldId: 'test-world',
  title: 'Engine test',
  order: 1,
  xp: 10,
  prerequisiteIds: [],
  steps: [
    {
      id: 'find-c',
      type: 'keyboard',
      prompt: 'Find C4',
      skillIds: ['keyboard'],
      config: { target: 'C4' },
      feedback: { wrongNote: 'Try the key beside the pair of black keys.' },
    },
    {
      id: 'build-scale',
      type: 'scaleBuild',
      prompt: 'Build the scale',
      skillIds: ['scale'],
      config: { root: 'C', kind: 'major' },
      feedback: {},
    },
  ],
};

describe('lesson engine', () => {
  it('grades rhythm taps by authored BPM with a 120ms beginner tolerance', () => {
    const tapLesson: Lesson = { ...lesson, steps: [{
      id: 'tap', type: 'rhythmTap', prompt: 'tap', skillIds: ['rhythm'],
      config: { bpm: 60, taps: 4 }, feedback: { timing: 'keep time' },
    }] };
    expect(submitAnswer(createLessonSession(tapLesson), [0, 1000, 2000, 3000]).feedback.correct).toBe(true);
    expect(submitAnswer(createLessonSession(tapLesson), [0, 700, 2000, 3000]).feedback.correct).toBe(false);
  });

  it('grades eight-bar phrase taps at bar intervals and requires authored accents', () => {
    const phraseLesson: Lesson = { ...lesson, steps: [{
      id: 'phrase', type: 'rhythmTap', prompt: 'phrase', skillIds: ['creation'],
      config: { bpm: 60, bars: 8, accents: [1, 5] }, feedback: { accent: 'mark phrases' },
    }] };
    const timestamps = Array.from({ length: 8 }, (_, index) => index * 4000);
    expect(submitAnswer(createLessonSession(phraseLesson), { timestamps, accents: [1, 5] }).feedback.correct).toBe(true);
    expect(submitAnswer(createLessonSession(phraseLesson), { timestamps, accents: [1] }).feedback.correct).toBe(false);
  });

  it('does not accept generic acknowledgements for listening or studio transfer', () => {
    const authored: Lesson = { ...lesson, steps: [
      { id: 'listen', type: 'listen', prompt: 'listen', skillIds: ['pitch'], config: { notes: ['C4', 'G4'] }, feedback: { replay: 'again' } },
      { id: 'transfer', type: 'studioTransfer', prompt: 'transfer', skillIds: ['creation'], config: { targetTrack: 'melody' }, feedback: { missing: 'apply it' } },
    ] };
    expect(submitAnswer(createLessonSession(authored), true).feedback.correct).toBe(false);
    let session = submitAnswer(createLessonSession(authored), { listened: true, sampleCount: 2 }).session;
    expect(session.stepIndex).toBe(1);
    expect(submitAnswer(session, true).feedback.correct).toBe(false);
    session = submitAnswer(session, { applied: true, compositionId: 'lesson-draft', trackActions: ['melody'] }).session;
    expect(session.stepIndex).toBe(2);
    expect((session as unknown as { completedChallenge: boolean }).completedChallenge).toBe(true);
  });

  it('requires an explicit edited eight-bar structure instead of a generated expected answer', () => {
    const buildLesson: Lesson = { ...lesson, steps: [{
      id: 'form', type: 'rhythmBuild', prompt: 'form', skillIds: ['creation'],
      config: { bars: 8, copyRange: [1, 4], variationBar: 8 }, feedback: { form: 'edit form' },
    }] };
    expect(submitAnswer(createLessonSession(buildLesson), Array(8).fill('bar')).feedback.correct).toBe(false);
    expect(submitAnswer(createLessonSession(buildLesson), { bars: ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'B'] }).feedback.correct).toBe(true);
  });
  it('starts at the first step with no attempts or hints', () => {
    expect(createLessonSession(lesson)).toMatchObject({
      lessonId: lesson.id,
      stepIndex: 0,
      correctCount: 0,
      attempts: 0,
      hintLevel: 0,
      requiresVariant: false,
      answers: [],
    });
  });

  it('returns progressively stronger feedback and requests a variant after three errors', () => {
    const first = submitAnswer(createLessonSession(lesson), 'D4');
    const second = submitAnswer(first.session, 'E4');
    const third = submitAnswer(second.session, 'F4');

    expect(first.feedback.level).toBe(1);
    expect(second.feedback.level).toBe(2);
    expect(third.feedback.level).toBe(3);
    expect(third.session.requiresVariant).toBe(true);
    expect(third.session.stepIndex).toBe(0);
    expect(third.session.answers).toHaveLength(3);
  });

  it('raises hints to level three without exceeding it', () => {
    const start = createLessonSession(lesson);
    const twice = requestHint(requestHint(start));
    const capped = requestHint(requestHint(twice));

    expect(twice.hintLevel).toBe(2);
    expect(capped.hintLevel).toBe(3);
  });

  it('advances on a correct answer and clears step-local recovery state', () => {
    const hinted = requestHint(createLessonSession(lesson));
    const { session, feedback } = submitAnswer(hinted, 'C4');

    expect(feedback).toMatchObject({ correct: true, level: 0 });
    expect(session).toMatchObject({
      stepIndex: 1,
      correctCount: 1,
      attempts: 1,
      hintLevel: 0,
      requiresVariant: false,
    });
  });

  it('uses music domain builders when checking scales', () => {
    const firstStepDone = submitAnswer(createLessonSession(lesson), 'C4').session;
    const result = submitAnswer(firstStepDone, ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']);

    expect(result.feedback.correct).toBe(true);
    expect(result.session.stepIndex).toBe(2);
  });

  it('scores a clean completion above a hinted, error-prone completion', () => {
    let clean = createLessonSession(lesson);
    clean = submitAnswer(clean, 'C4').session;
    clean = submitAnswer(clean, ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']).session;

    let assisted = requestHint(createLessonSession(lesson));
    assisted = submitAnswer(assisted, 'D4').session;
    assisted = submitAnswer(assisted, 'C4').session;
    assisted = submitAnswer(assisted, ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']).session;

    expect(scoreLesson(clean)).toEqual({ score: 100, stars: 2 });
    expect(scoreLesson(assisted).score).toBeLessThan(100);
    expect(scoreLesson(assisted).stars).toBeLessThan(3);
  });

  it('accepts arpeggio demonstrations and generated choices used by lesson content', () => {
    const contentLesson: Lesson = {
      ...lesson,
      id: 'content-shapes',
      steps: [
        { id: 'hear', type: 'listen', prompt: 'hear', skillIds: ['chord'], config: { arpeggio: ['C4', 'E4', 'G4'] }, feedback: {} },
        { id: 'choose', type: 'choice', prompt: 'choose', skillIds: ['pitch'], config: { choices: ['E', 'F', 'G'] }, feedback: {} },
      ],
    };
    let session = submitAnswer(createLessonSession(contentLesson), { listened: true, sampleCount: 3 }).session;
    session = submitAnswer(session, 'E').session;

    expect(session.stepIndex).toBe(2);
  });

  it('requires a different variant answer after three errors', () => {
    let session = createLessonSession(lesson);
    session = submitAnswer(session, 'D4').session;
    session = submitAnswer(session, 'D4').session;
    session = submitAnswer(session, 'D4').session;

    expect(getCurrentStep(session).id).not.toBe(lesson.steps[0].id);
    const originalRetry = submitAnswer(session, 'C4').session;
    expect(originalRetry.stepIndex).toBe(0);
    expect(originalRetry.completedVariant).toBe(false);

    const variantAnswer = getExpectedAnswer(getCurrentStep(originalRetry));
    const variantDone = submitAnswer(originalRetry, variantAnswer).session;
    expect(variantDone.stepIndex).toBe(1);
    expect(variantDone.completedVariant).toBe(true);
  });

  it('returns distinct direction, structure, and demonstration hints', () => {
    let session = createLessonSession(lesson);
    const hints = [];
    for (let level = 0; level < 3; level += 1) {
      session = requestHint(session);
      hints.push(getHint(session));
    }

    expect(new Set(hints).size).toBe(3);
    expect(hints[2]).toContain('C4');
  });
});
