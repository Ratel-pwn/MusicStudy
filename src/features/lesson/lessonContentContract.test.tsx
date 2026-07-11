import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
import type { LessonStep } from '../../content/schema';
import { lessons } from '../../content/worlds';
import { rhythmEighthSubdivisionLesson } from '../../content/lessons/rhythm-eighth-subdivision';
import { pitchHighLowLesson } from '../../content/lessons/pitch-high-low';
import { pitchMiddleCLesson } from '../../content/lessons/pitch-middle-c';
import { scaleCMajorLesson } from '../../content/lessons/scale-c-major';
import { chordCMajorLesson } from '../../content/lessons/chord-c-major';
import { createLessonSession, getCurrentStep, getExpectedAnswer, submitAnswer } from './lessonEngine';
import { stepRenderers } from './LessonPage';

const interactiveTypes = new Set(['keyboard', 'choice', 'rhythmTap', 'rhythmBuild', 'scaleBuild', 'chordBuild']);

it('has an engine answer that completes every interactive step in all eight lessons', () => {
  expect(lessons).toHaveLength(8);
  lessons.forEach((lesson) => {
    lesson.steps.filter((step) => interactiveTypes.has(step.type)).forEach((step) => {
      const focusedLesson = { ...lesson, steps: [step] };
      const result = submitAnswer(createLessonSession(focusedLesson), getExpectedAnswer(step));
      expect(result.session.stepIndex, `${lesson.id}/${step.id}`).toBe(1);
    });
  });
});

function RendererHarness({ step }: { step: LessonStep }) {
  const [answer, setAnswer] = useState<unknown>();
  const Renderer = stepRenderers[step.type];
  return <><Renderer answer={answer} playMidi={vi.fn()} setAnswer={setAnswer} step={step} /><output>{JSON.stringify(answer)}</output></>;
}

it('derives a C3 through C5 keyboard from the real first lesson step', () => {
  const step = pitchHighLowLesson.steps.find((item) => item.id === 'high-low-follow')!;
  render(<RendererHarness step={step} />);

  expect(screen.getByRole('button', { name: 'C3' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'C5' })).toBeInTheDocument();
});

it('submits eight taps for the real taps-number lesson', async () => {
  const user = userEvent.setup();
  const step = rhythmEighthSubdivisionLesson.steps.find((item) => item.id === 'eighth-follow')!;
  render(<RendererHarness step={step} />);

  const tap = screen.getByRole('button', { name: '打拍，0 / 8' });
  for (let count = 0; count < 8; count += 1) await user.click(tap);
  expect(screen.getByRole('button', { name: '打拍，8 / 8' })).toBeInTheDocument();
});

it('records all three repeated C4 plays required by the real middle-C lesson', async () => {
  const user = userEvent.setup();
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const step = pitchMiddleCLesson.steps.find((item) => item.id === 'middle-c-follow')!;
  render(<RendererHarness step={step} />);

  const key = screen.getByRole('button', { name: 'C4' });
  await user.click(key);
  await user.click(key);
  await user.click(key);
  expect(screen.getByText('["C4","C4","C4"]')).toBeInTheDocument();
  expect(getExpectedAnswer(step)).toEqual(['C4', 'C4', 'C4']);
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

it('renders six cells for the authored eighth-note rhythm', () => {
  const step = rhythmEighthSubdivisionLesson.steps.find((item) => item.id === 'eighth-build')!;
  render(<RendererHarness step={step} />);

  expect(screen.getAllByRole('button', { name: /第 \d 拍，空/ })).toHaveLength(6);
});

it('requires the octave tonic as the eighth C-major scale item', () => {
  const step = scaleCMajorLesson.steps.find((item) => item.id === 'c-scale-build')!;
  expect(getExpectedAnswer(step)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']);
});

function variantFor(step: LessonStep) {
  const focusedLesson = { ...scaleCMajorLesson, id: `variant-${step.id}`, steps: [step] };
  let session = createLessonSession(focusedLesson);
  session = submitAnswer(session, '__wrong__').session;
  session = submitAnswer(session, '__wrong__').session;
  session = submitAnswer(session, '__wrong__').session;
  return { session, step: getCurrentStep(session) };
}

it('serializes a scale variant and renders its accidental degree', () => {
  const original = scaleCMajorLesson.steps.find((item) => item.type === 'scaleBuild')!;
  const variant = variantFor(original);
  const restored = JSON.parse(JSON.stringify(variant.session));
  expect(getExpectedAnswer(getCurrentStep(restored))).toContain('F#');

  render(<RendererHarness step={variant.step} />);
  expect(screen.getByRole('button', { name: '添加 F#' })).toBeInTheDocument();
});

it('renders the flat third required by the chord variant', () => {
  const original = chordCMajorLesson.steps.find((item) => item.type === 'chordBuild')!;
  const variant = variantFor(original);
  expect(getExpectedAnswer(variant.step)).toEqual(['C', 'Eb', 'G']);

  render(<RendererHarness step={variant.step} />);
  expect(screen.getByRole('button', { name: '添加 Eb' })).toBeInTheDocument();
});
