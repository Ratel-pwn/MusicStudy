import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { db } from '../../data/db';
import { pitchHighLowLesson } from '../../content/lessons/pitch-high-low';
import { pitchMiddleCLesson } from '../../content/lessons/pitch-middle-c';
import { getAudioChoiceCandidates } from '../lesson/audioChoice';
import { PracticePage } from './PracticePage';
import type { PracticeItem } from './scheduler';

const practiceAudio = vi.hoisted(() => ({ playSequence: vi.fn(), playTimed: vi.fn(), startMetronome: vi.fn(), stop: vi.fn() }));
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

const highLowStep = pitchHighLowLesson.steps.find((item) => item.id === 'high-low-choose')!;
const higherCandidate = getAudioChoiceCandidates(highLowStep).find(({ choice }) => choice === '更高')!;

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
    await user.click(screen.getByRole('button', { name: `试听并选择候选 ${higherCandidate.label}` }));
    await user.click(screen.getByRole('button', { name: '提交答案' }));
    await user.click(screen.getByRole('button', { name: '继续' }));

    expect(await screen.findByRole('heading', { name: /节奏/ })).toBeInTheDocument();
    expect(screen.getByText(/7月14日/)).toBeInTheDocument();
  });

  it('plays authored comparison audio inside a practice item', async () => {
    const user = userEvent.setup();
    render(<PracticePage items={[items[0]]} />);
    const highLowChoice = screen.getAllByRole('button', { name: /试听并选择候选/ })[0];
    await user.click(highLowChoice);
    expect(practiceAudio.playSequence).toHaveBeenCalled();
  });

  it('runs the anonymous central-C choice through practice without exposing note names', async () => {
    const user = userEvent.setup();
    const keyboardItem: PracticeItem = { id: 'weak:keyboard', source: 'weak', skillId: 'keyboard', mastery: 18 };
    const step = pitchMiddleCLesson.steps.find((item) => item.id === 'middle-c-choose')!;
    const candidate = getAudioChoiceCandidates(step).find(({ choice }) => choice === '中央音区')!;

    render(<PracticePage items={[keyboardItem]} />);

    const candidateButtons = screen.getAllByRole('button', { name: /试听并选择候选/ });
    expect(candidateButtons).toHaveLength(3);
    for (const note of ['C3', 'C4', 'C5']) {
      expect(candidateButtons.every((button) => !button.getAttribute('aria-label')?.includes(note) && !button.textContent?.includes(note))).toBe(true);
    }

    await user.click(screen.getByRole('button', { name: `试听并选择候选 ${candidate.label}`, pressed: false }));
    expect(practiceAudio.playSequence).toHaveBeenCalledWith([60], .5);
    expect(screen.getByRole('button', { name: '提交答案' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: '提交答案' }));
    await user.click(screen.getByRole('button', { name: '继续' }));
    expect(await screen.findByRole('heading', { name: '今天的练习航道已走完' })).toBeInTheDocument();
  });

  it('uses a real authored notation construction instead of the generic fallback', async () => {
    const user = userEvent.setup();
    const notationItem: PracticeItem = { id: 'weak:notation', source: 'weak', skillId: 'notation', mastery: 18 };
    render(<PracticePage items={[notationItem]} />);
    expect(screen.getByRole('group', { name: '节奏素材' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '符合规则' })).not.toBeInTheDocument();
    for (let beat = 1; beat <= 4; beat += 1) {
      await user.click(screen.getByRole('button', { name: `第 ${beat} 拍，空` }));
    }
    await user.click(screen.getByRole('button', { name: '提交答案' }));
    await user.click(screen.getByRole('button', { name: '继续' }));
    expect(await screen.findByRole('heading', { name: '今天的练习航道已走完' })).toBeInTheDocument();
  });

  it('persists mastery and the next review date when a task is completed', async () => {
    const user = userEvent.setup();
    render(<PracticePage items={[items[0]]} now={() => new Date('2026-07-11T08:00:00.000Z')} />);

    await user.click(screen.getByRole('button', { name: `试听并选择候选 ${higherCandidate.label}` }));
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

    await user.click(screen.getByRole('button', { name: `试听并选择候选 ${higherCandidate.label}` }));
    await user.click(screen.getByRole('button', { name: '提交答案' }));
    await user.click(screen.getByRole('button', { name: '继续' }));

    expect(await screen.findByText(/下次复习：7月14日/)).toBeInTheDocument();
  });
});
