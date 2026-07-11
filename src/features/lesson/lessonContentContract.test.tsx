import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { vi } from 'vitest';
import { db } from '../../data/db';
import type { LessonStep } from '../../content/schema';
import { lessons } from '../../content/worlds';
import { rhythmEighthSubdivisionLesson } from '../../content/lessons/rhythm-eighth-subdivision';
import { pitchHighLowLesson } from '../../content/lessons/pitch-high-low';
import { pitchMiddleCLesson } from '../../content/lessons/pitch-middle-c';
import { scaleCMajorLesson } from '../../content/lessons/scale-c-major';
import { chordCMajorLesson } from '../../content/lessons/chord-c-major';
import { createLessonSession, getCurrentStep, getExpectedAnswer, submitAnswer, validateStepAnswer } from './lessonEngine';
import { stepRenderers } from './LessonPage';

async function performAuthoredAction(step: LessonStep) {
  const user = userEvent.setup();
  if (step.type === 'listen') await user.click(screen.getByRole('button', { name: '播放示范' }));
  else if (step.type === 'explain') await user.click(screen.getByRole('button', { name: '我看清了' }));
  else if (step.type === 'keyboard') {
    const expected = getExpectedAnswer(step);
    for (const note of (Array.isArray(expected) ? expected : [expected]) as string[]) await user.click(screen.getByRole('button', { name: note }));
  } else if (step.type === 'choice') {
    await user.click(screen.getByRole('button', { name: `试听 ${String(getExpectedAnswer(step))}` }));
    await user.click(screen.getByRole('button', { name: String(getExpectedAnswer(step)), pressed: false }));
  }
  else if (step.type === 'rhythmTap') {
    const count = (getExpectedAnswer(step) as number[]).length;
    const accents = Array.isArray(step.config.accents) ? step.config.accents as number[] : [];
    await user.click(screen.getByRole('button', { name: '开始节拍' }));
    for (let index = 0; index < count; index += 1) {
      if (accents.includes(index + 1)) await user.click(screen.getByRole('button', { name: '下一小节重拍' }));
      await user.click(screen.getByRole('button', { name: /打拍/ }));
    }
  } else if (step.type === 'rhythmBuild' && Array.isArray(step.config.units)) {
    const units = step.config.units as Array<'quarter' | 'eighth'>;
    for (const [index, unit] of units.entries()) {
      await user.click(screen.getByRole('button', { name: unit === 'quarter' ? '四分音符' : '八分音符' }));
      await user.click(screen.getByRole('button', { name: new RegExp(`第 ${index + 1} 拍`) }));
    }
  } else if (step.type === 'rhythmBuild') {
    await user.click(screen.getByRole('button', { name: '第 8 小节，段落 A' }));
  } else if (step.type === 'scaleBuild' || step.type === 'chordBuild') {
    for (const note of getExpectedAnswer(step) as string[]) await user.click(screen.getByRole('button', { name: `添加 ${note}` }));
  } else if (step.type === 'studioTransfer') {
    await user.click(screen.getByRole('button', { name: '写入作品' }));
    await waitFor(() => expect(screen.getByTestId('renderer-answer').textContent).not.toBe(''));
  }
}

it('completes every authored step in all eight lessons through its real renderer action', async () => {
  await db.delete();
  await db.open();
  expect(lessons).toHaveLength(8);
  for (const lesson of lessons) {
    for (const step of lesson.steps) {
      render(<RendererHarness step={step} />);
      await performAuthoredAction(step);
      const serialized = screen.getByTestId('renderer-answer').textContent ?? '';
      expect(serialized, `${lesson.id}/${step.id} produced no UI answer`).not.toBe('');
      const answer = JSON.parse(serialized);
      expect(validateStepAnswer(step, answer), `${lesson.id}/${step.id}`).toBe(true);
      cleanup();
    }
  }
}, 20_000);

function RendererHarness({ step }: { step: LessonStep }) {
  const [answer, setAnswer] = useState<unknown>();
  const interval = 60_000 / (typeof step.config.bpm === 'number' ? step.config.bpm : 90) / (typeof step.config.subdivision === 'number' ? step.config.subdivision : 1) * (Array.isArray(step.config.accents) ? 4 : 1);
  const time = useRef(-interval);
  const Renderer = stepRenderers[step.type];
  return <><Renderer answer={answer} now={() => { time.current += interval; return time.current; }} playMidi={vi.fn()} playSequence={vi.fn()} setAnswer={setAnswer} startMetronome={async () => -interval} step={step} /><output data-testid="renderer-answer">{JSON.stringify(answer)}</output></>;
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

  await user.click(screen.getByRole('button', { name: '开始节拍' }));
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

it('plays distinct authored material for each choice option', async () => {
  const user = userEvent.setup();
  const playSequence = vi.fn();
  const step: LessonStep = {
    id: 'audio-choice', type: 'choice', prompt: 'compare', skillIds: ['pitch'],
    config: { choices: ['A', 'B'], answer: 'A', audioOptions: { A: ['C4', 'G4'], B: ['C4', 'F3'] } }, feedback: {},
  };
  const Renderer = stepRenderers.choice;
  render(<Renderer answer={undefined} playMidi={vi.fn()} playSequence={playSequence} setAnswer={vi.fn()} step={step} />);
  await user.click(screen.getByRole('button', { name: '试听 A' }));
  await user.click(screen.getByRole('button', { name: '试听 B' }));
  expect(playSequence.mock.calls[0][0]).not.toEqual(playSequence.mock.calls[1][0]);
});

it('routes typed choice timing to the timed audio scheduler', async () => {
  const user = userEvent.setup();
  const playTimed = vi.fn();
  const events = [{ midi: 60, offsetBeats: 0, durationBeats: .25 }, { midi: 60, offsetBeats: .4, durationBeats: .25 }];
  const step: LessonStep = {
    id: 'timed-choice', type: 'choice', prompt: 'compare rhythm', skillIds: ['rhythm'],
    config: { choices: ['A', 'B'], answer: 'A', audioOptions: { A: events, B: [{ ...events[1], offsetBeats: .2 }] } }, feedback: {},
  };
  const Renderer = stepRenderers.choice;
  render(<Renderer answer={undefined} playMidi={vi.fn()} playSequence={vi.fn()} playTimed={playTimed} setAnswer={vi.fn()} step={step} />);
  await user.click(screen.getByRole('button', { name: '试听 A' }));
  expect(playTimed).toHaveBeenCalledWith(events);
});

it('starts an audible BPM target with absolute beat timestamps', async () => {
  const user = userEvent.setup();
  const step: LessonStep = { id: 'timed', type: 'rhythmTap', prompt: 'tap', skillIds: ['rhythm'], config: { bpm: 60, taps: 3 }, feedback: {} };
  const Renderer = stepRenderers.rhythmTap;
  const answers: unknown[] = [];
  const startMetronome = vi.fn(async () => 0);
  const values = [0, 1000, 2000, 3000];
  render(<Renderer answer={answers.at(-1)} now={() => values.shift() ?? 3000} playMidi={vi.fn()} playSequence={vi.fn()} setAnswer={(answer) => answers.push(answer)} startMetronome={startMetronome} step={step} />);
  expect(screen.getByText('60 BPM')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '开始节拍' }));
  expect(startMetronome).toHaveBeenCalledWith(60);
  expect(answers.at(-1)).toMatchObject({ targetTimestamps: [1000, 2000, 3000] });
});

function AsyncTimedHarness({ startMetronome, now }: { startMetronome(bpm: number): Promise<number>; now(): number }) {
  const [answer, setAnswer] = useState<unknown>();
  const step: LessonStep = { id: 'async-timed', type: 'rhythmTap', prompt: 'tap', skillIds: ['rhythm'], config: { bpm: 60, taps: 3 }, feedback: {} };
  const Renderer = stepRenderers.rhythmTap;
  return <><Renderer answer={answer} now={now} playMidi={vi.fn()} setAnswer={setAnswer} startMetronome={startMetronome} step={step} /><output data-testid="async-timed-answer">{JSON.stringify(answer)}</output></>;
}

it('waits for real metronome start before activating targets and accepts on-beat taps', async () => {
  const user = userEvent.setup();
  let resolveStart!: (startedAt: number) => void;
  const delayedStart = vi.fn(() => new Promise<number>((resolve) => { resolveStart = resolve; }));
  const tapTimes = [1500, 2500, 3500];
  render(<AsyncTimedHarness now={() => tapTimes.shift() ?? 3500} startMetronome={delayedStart} />);
  await user.click(screen.getByRole('button', { name: '开始节拍' }));
  expect(screen.getByTestId('async-timed-answer')).toBeEmptyDOMElement();
  resolveStart(500);
  await waitFor(() => expect(screen.getByTestId('async-timed-answer')).toHaveTextContent('targetTimestamps'));
  for (let index = 0; index < 3; index += 1) await user.click(screen.getByRole('button', { name: /打拍/ }));
  const answer = JSON.parse(screen.getByTestId('async-timed-answer').textContent ?? 'null');
  expect(validateStepAnswer({ id: 'async-timed', type: 'rhythmTap', prompt: 'tap', skillIds: ['rhythm'], config: { bpm: 60, taps: 3 }, feedback: {} }, answer)).toBe(true);
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
