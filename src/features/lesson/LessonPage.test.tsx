import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import type { Lesson } from '../../content/schema';
import { createLessonSession } from './lessonEngine';
import { LessonPage } from './LessonPage';

const audio = vi.hoisted(() => ({ playMidi: vi.fn(), stop: vi.fn() }));
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
  await user.click(screen.getByRole('button', { name: '继续' }));
  expect(screen.getByText('听一次收束')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '播放示范' }));
  await user.click(screen.getByRole('button', { name: '提交答案' }));
  await user.click(screen.getByRole('button', { name: '继续' }));

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

it('saves before exiting', async () => {
  const user = userEvent.setup();
  const onExit = vi.fn();
  render(<LessonPage lesson={lesson} onExit={onExit} />);

  await user.click(screen.getByRole('button', { name: '退出课程' }));

  expect(onExit).toHaveBeenCalledOnce();
  expect(localStorage.getItem(`musicstudy:lesson:${lesson.id}`)).not.toBeNull();
});
