import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { db } from '../../data/db';
import { PracticePage } from './PracticePage';
import type { PracticeItem } from './scheduler';

const practiceAudio = vi.hoisted(() => ({ playSequence: vi.fn(), startMetronome: vi.fn(), stop: vi.fn() }));
vi.mock('../../audio/useAudio', () => ({
  useAudio: () => ({ engine: practiceAudio, status: 'ready', unlock: vi.fn() }),
}));

const items: PracticeItem[] = [
  {
    id: 'due:pitch',
    source: 'due',
    skillId: 'pitch',
    review: {
      skillId: 'pitch',
      mastery: 28,
      intervalDays: 1,
      dueAt: '2026-07-11T00:00:00.000Z',
      consecutiveCorrect: 0,
    },
  },
  { id: 'weak:rhythm', source: 'weak', skillId: 'rhythm', mastery: 22 },
];

describe('PracticePage', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterAll(async () => {
    await db.delete();
  });

  it('shows one active task in a lane and advances after completion', async () => {
    const user = userEvent.setup();
    render(<PracticePage items={items} now={() => new Date('2026-07-11T08:00:00.000Z')} />);

    expect(screen.getByRole('main', { name: '今日练习' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /音高/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /节奏/ })).not.toBeInTheDocument();

    expect(screen.queryByRole('button', { name: '独立完成' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^更高$/ }));
    await user.click(screen.getByRole('button', { name: '提交答案' }));
    await user.click(screen.getByRole('button', { name: '继续' }));

    expect(await screen.findByRole('heading', { name: /节奏/ })).toBeInTheDocument();
    expect(screen.getByText(/7月14日/)).toBeInTheDocument();
  });

  it('plays authored comparison audio inside a practice item', async () => {
    const user = userEvent.setup();
    render(<PracticePage items={[items[0]]} />);
    await user.click(screen.getByRole('button', { name: /^试听 更高$/ }));
    expect(practiceAudio.playSequence).toHaveBeenCalled();
  });

  it('persists mastery and the next review date when a task is completed', async () => {
    const user = userEvent.setup();
    render(<PracticePage items={[items[0]]} now={() => new Date('2026-07-11T08:00:00.000Z')} />);

    await user.click(screen.getByRole('button', { name: /^更高$/ }));
    await user.click(screen.getByRole('button', { name: '提交答案' }));
    await user.click(screen.getByRole('button', { name: '继续' }));

    await waitFor(async () => {
      await expect(db.reviews.get('pitch')).resolves.toMatchObject({
        mastery: 40,
        intervalDays: 3,
        dueAt: '2026-07-14T08:00:00.000Z',
      });
    });
    expect(screen.getByText(/下次复习：7月14日/)).toBeInTheDocument();
  });

  it('shows the next review date in the learner local timezone near midnight', async () => {
    const user = userEvent.setup();
    render(<PracticePage items={[items[0]]} now={() => new Date('2026-07-10T16:30:00.000Z')} />);

    await user.click(screen.getByRole('button', { name: /^更高$/ }));
    await user.click(screen.getByRole('button', { name: '提交答案' }));
    await user.click(screen.getByRole('button', { name: '继续' }));

    expect(await screen.findByText(/下次复习：7月14日/)).toBeInTheDocument();
  });
});
