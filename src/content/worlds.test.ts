import { getLesson, lessons, worlds } from './worlds';

const PLAYABLE_IDS = [
  'pitch-high-low',
  'pitch-middle-c',
  'keyboard-white-notes',
  'rhythm-quarter-pulse',
  'rhythm-eighth-subdivision',
  'scale-c-major',
  'chord-c-major',
  'creation-eight-bars',
] as const;

describe('playable curriculum', () => {
  it('authors distinct A/B audio material for every playable choice', () => {
    lessons.flatMap((lesson) => lesson.steps).filter((step) => step.type === 'choice').forEach((step) => {
      const choices = step.config.choices as string[];
      const audioOptions = step.config.audioOptions as Record<string, string[]> | undefined;
      expect(audioOptions, step.id).toBeDefined();
      expect(Object.keys(audioOptions ?? {}), step.id).toEqual(choices);
      expect(new Set(Object.values(audioOptions ?? {}).map((notes) => JSON.stringify(notes))).size, step.id).toBe(choices.length);
    });
  });
  it('contains exactly the eight required playable lessons', () => {
    expect(lessons.map((lesson) => lesson.id)).toEqual(PLAYABLE_IDS);
    expect(PLAYABLE_IDS.map((id) => getLesson(id)?.id)).toEqual(PLAYABLE_IDS);
    expect(getLesson('not-a-lesson')).toBeUndefined();
  });

  it.each(PLAYABLE_IDS)('%s has a complete learn-by-doing sequence', (id) => {
    const lesson = getLesson(id)!;
    expect(lesson.steps.length).toBeGreaterThanOrEqual(6);
    expect(lesson.steps.length).toBeLessThanOrEqual(9);
    expect(lesson.steps[0].type).toBe('listen');
    expect(lesson.steps[1].type).toBe('explain');
    expect(lesson.steps.at(-1)?.type).toBe('studioTransfer');
    expect(lesson.steps.some((step) => ['listen', 'choice', 'rhythmTap'].includes(step.type))).toBe(true);
    expect(
      lesson.steps.some((step) =>
        ['keyboard', 'rhythmBuild', 'scaleBuild', 'chordBuild', 'studioTransfer'].includes(step.type),
      ),
    ).toBe(true);
    expect(new Set(lesson.steps.map((step) => step.id)).size).toBe(lesson.steps.length);
    lesson.steps.forEach((step) => {
      expect(step.prompt.trim().length).toBeGreaterThan(8);
      expect(step.skillIds.length).toBeGreaterThan(0);
      expect(Object.keys(step.feedback).length).toBeGreaterThan(0);
      Object.entries(step.feedback).forEach(([errorCode, reason]) => {
        expect(errorCode.trim().length).toBeGreaterThan(2);
        expect(reason.trim().length).toBeGreaterThan(8);
      });
    });
  });

  it('references only existing prerequisites and contains no cycles', () => {
    const ids = new Set(lessons.map((lesson) => lesson.id));
    lessons.forEach((lesson) => {
      lesson.prerequisiteIds.forEach((prerequisiteId) => expect(ids.has(prerequisiteId)).toBe(true));
    });

    const visit = (id: string, path: Set<string>): void => {
      expect(path.has(id), `cycle detected at ${id}`).toBe(false);
      const nextPath = new Set(path).add(id);
      getLesson(id)?.prerequisiteIds.forEach((prerequisiteId) => visit(prerequisiteId, nextPath));
    };
    lessons.forEach((lesson) => visit(lesson.id, new Set()));
  });

  it('ends the middle C transfer prompt on its configured cadence note', () => {
    const transfer = getLesson('pitch-middle-c')!.steps.find((step) => step.id === 'middle-c-transfer')!;
    const promptNotes = transfer.prompt.match(/[A-G][#b]?\d/g) ?? [];

    expect(promptNotes.at(-1)).toBe(transfer.config.cadenceNote);
  });
});

describe('long-term course map', () => {
  it('outlines four shared foundation islands and three advanced routes', () => {
    expect(worlds.filter((world) => world.route === 'foundation')).toHaveLength(4);
    expect(worlds.some((world) => world.route === 'pop')).toBe(true);
    expect(worlds.some((world) => world.route === 'classical')).toBe(true);
    expect(worlds.some((world) => world.route === 'creation' && world.title === '创作山')).toBe(true);
  });

  it('gives every planned node a concrete capability goal', () => {
    const plannedNodes = worlds.flatMap((world) => world.nodes).filter((node) => node.availability === 'planned');
    expect(plannedNodes.length).toBeGreaterThan(0);
    plannedNodes.forEach((node) => expect(node.capabilityGoal.trim().length).toBeGreaterThan(10));
  });
});
