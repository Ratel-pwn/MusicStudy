import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import type { Lesson } from '../../content/schema';
import { pitchHighLowLesson } from '../../content/lessons/pitch-high-low';
import { scaleCMajorLesson } from '../../content/lessons/scale-c-major';
import { createLessonSession } from './lessonEngine';
import { LessonPage } from './LessonPage';

const audio = vi.hoisted(() => ({ playMidi: vi.fn(), playSequence: vi.fn(), startMetronome: vi.fn(async () => performance.now()), stop: vi.fn() }));
const progress = vi.hoisted(() => ({ completeLesson: vi.fn(), recordAttempt: vi.fn() }));

const stored = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    clear: () => stored.clear(),
    getItem: (key: string) => stored.get(key) ?? null,
    removeItem: (key: string) => stored.delete(key),
    setItem: (key: string, value: string) => stored.set(key, value),
  },
});

vi.mock('../../audio/useAudio', () => ({
  useAudio: () => ({ engine: audio, status: 'ready', unlock: vi.fn(), retry: vi.fn() }),
}));
vi.mock('../../stores/useProgressStore', () => ({
  useProgressStore: (selector: (state: typeof progress) => unknown) => selector(progress),
}));

const lesson: Lesson = {
  id: 'lesson-page-test',
  worldId: 'test-world',
  title: '中央 C 练习',
  order: 1,
  xp: 50,
  prerequisiteIds: [],
  steps: [
    { id: 'play-c', type: 'keyboard', prompt: '弹出中央 C', skillIds: ['keyboard'], config: { target: 'C4' }, feedback: { wrong: '回到 C4' } },
    { id: 'listen', type: 'listen', prompt: '听一次收束', skillIds: ['pitch'], config: {}, feedback: {} },
  ],
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  progress.completeLesson.mockResolvedValue(undefined);
  progress.recordAttempt.mockResolvedValue(undefined);
});

it('completes through the renderer registry and persists the real variant result', async () => {
  const user = userEvent.setup();
  render(<LessonPage lesson={lesson} onExit={vi.fn()} />);

  await user.click(screen.getByRole('button', { name: 'D4' }));
  await user.click(screen.getByRole('button', { name: '提交答案' }));
  await user.click(screen.getByRole('button', { name: '提交答案' }));
  await user.click(screen.getByRole('button', { name: '提交答案' }));
  expect(screen.getByText('需要一个变式')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'C4' }));
  await user.click(screen.getByRole('button', { name: '提交答案' }));
  expect(screen.queryByText('听一次收束')).not.toBeInTheDocument();
  expect(progress.completeLesson).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'C#4' }));
  await user.click(screen.getByRole('button', { name: '提交答案' }));
  await user.click(screen.getByRole('button', { name: '继续' }));
  expect(screen.getByText('听一次收束')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '播放示范' }));
  await user.click(screen.getByRole('button', { name: '继续课程' }));

  expect(progress.completeLesson).toHaveBeenCalledWith(expect.objectContaining({
    lessonId: lesson.id,
    completedVariant: true,
  }));
  expect(localStorage.getItem(`musicstudy:lesson:${lesson.id}`)).toBeNull();
});

it('restores the saved step after leaving and returning', () => {
  const saved = { ...createLessonSession(lesson), stepIndex: 1, correctCount: 1, attempts: 1 };
  localStorage.setItem(`musicstudy:lesson:${lesson.id}`, JSON.stringify(saved));

  render(<LessonPage lesson={lesson} onExit={vi.fn()} />);

  expect(screen.getByText('听一次收束')).toBeInTheDocument();
  expect(screen.getByText('2 / 2')).toBeInTheDocument();
});

it('gives listening steps a clear continuation without presenting an empty answer state', async () => {
  const user = userEvent.setup();
  const guidedLesson: Lesson = {
    ...lesson,
    id: 'guided-listening-test',
    steps: [
      { id: 'listen-first', type: 'listen', prompt: '先听两枚音', skillIds: ['pitch'], config: { sequence: ['C4', 'G4'] }, feedback: {} },
      pitchHighLowLesson.steps.find((step) => step.id === 'high-low-see')!,
    ],
  };
  render(<LessonPage lesson={guidedLesson} onExit={vi.fn()} />);

  expect(screen.queryByRole('button', { name: '提交答案' })).not.toBeInTheDocument();
  expect(screen.getByText('聆听示范 · 无需选择')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '播放后继续' })).toBeDisabled();

  await user.click(screen.getByRole('button', { name: '播放示范' }));
  expect(screen.getByRole('button', { name: '继续课程' })).toBeEnabled();
  await user.click(screen.getByRole('button', { name: '继续课程' }));

  expect(screen.getByText(/观察竖直音高轨迹/)).toBeInTheDocument();
  expect(screen.getByRole('img', { name: '音高由低向高移动的竖直轨迹' })).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('观察讲解 · 无需选择')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '确认理解后继续' })).toBeDisabled();
});

it('saves before exiting', async () => {
  const user = userEvent.setup();
  const onExit = vi.fn();
  render(<LessonPage lesson={lesson} onExit={onExit} />);

  await user.click(screen.getByRole('button', { name: '退出课程' }));

  expect(onExit).toHaveBeenCalledOnce();
  expect(localStorage.getItem(`musicstudy:lesson:${lesson.id}`)).not.toBeNull();
});

it('tabs from the exit action into the primary lesson interaction', async () => {
  const user = userEvent.setup();
  render(<LessonPage lesson={lesson} onExit={vi.fn()} />);

  await user.tab();
  expect(screen.getByRole('button', { name: '退出课程' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: '重新开始' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'C4' })).toHaveFocus();
});

it('places restart to the right of the progress bar', () => {
  render(<LessonPage lesson={lesson} onExit={vi.fn()} />);

  const progressbar = screen.getByRole('progressbar', { name: '课程进度' });
  const restart = screen.getByRole('button', { name: '重新开始' });
  expect(progressbar.compareDocumentPosition(restart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it('cancels restarting and keeps the current lesson step', async () => {
  const user = userEvent.setup();
  const saved = { ...createLessonSession(lesson), stepIndex: 1, correctCount: 1, attempts: 1 };
  localStorage.setItem(`musicstudy:lesson:${lesson.id}`, JSON.stringify(saved));
  render(<LessonPage lesson={lesson} onExit={vi.fn()} />);

  await user.click(screen.getByRole('button', { name: '重新开始' }));
  expect(screen.getByRole('dialog', { name: '重新开始本关？' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '继续学习' }));

  expect(screen.queryByRole('dialog', { name: '重新开始本关？' })).not.toBeInTheDocument();
  expect(screen.getByText('听一次收束')).toBeInTheDocument();
  expect(screen.getByText('2 / 2')).toBeInTheDocument();
});

it('confirms restarting and clears session, feedback, audio, and same-step renderer state', async () => {
  const user = userEvent.setup();
  render(<LessonPage lesson={lesson} onExit={vi.fn()} />);

  const wrongKey = screen.getByRole('button', { name: 'D4' });
  await user.click(wrongKey);
  expect(wrongKey).toHaveAttribute('aria-pressed', 'true');
  await user.click(screen.getByRole('button', { name: '提交答案' }));
  expect(screen.getByRole('dialog', { name: '需要调整，反馈级别 1' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '重新开始' }));
  await user.click(screen.getByRole('button', { name: '确认重新开始' }));

  expect(audio.stop).toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('弹出中央 C')).toBeInTheDocument();
  expect(screen.getByText('1 / 2')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'D4' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('button', { name: '提交答案' })).toBeDisabled();
  expect(JSON.parse(localStorage.getItem(`musicstudy:lesson:${lesson.id}`) ?? '{}')).toMatchObject({
    stepIndex: 0,
    correctCount: 0,
    attempts: 0,
    hintLevel: 0,
    answers: [],
  });
});

it('clears a full original scale answer on variant switch and completes the real variant', async () => {
  const user = userEvent.setup();
  const scaleStep = scaleCMajorLesson.steps.find((step) => step.type === 'scaleBuild')!;
  const focusedLesson: Lesson = { ...scaleCMajorLesson, id: 'scale-variant-ui', steps: [scaleStep] };
  render(<LessonPage lesson={focusedLesson} onExit={vi.fn()} />);

  for (let count = 0; count < 8; count += 1) {
    await user.click(screen.getByRole('button', { name: '添加 C' }));
  }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await user.click(screen.getByRole('button', { name: '提交答案' }));
    await user.click(screen.getByRole('button', { name: '再试一次' }));
  }

  expect(screen.getByText(/（变式）/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '提交答案' })).toBeDisabled();

  for (const note of ['D', 'E', 'F#', 'G', 'A', 'B', 'C#', 'D']) {
    await user.click(screen.getByRole('button', { name: `添加 ${note}` }));
  }
  await user.click(screen.getByRole('button', { name: '提交答案' }));
  await user.click(screen.getByRole('button', { name: '继续' }));

  expect(progress.completeLesson).toHaveBeenCalledWith(expect.objectContaining({
    lessonId: focusedLesson.id,
    completedVariant: true,
  }));
});
