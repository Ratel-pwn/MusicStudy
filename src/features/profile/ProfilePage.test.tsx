import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { AttemptRecord, ReviewRecord } from '../../data/db';
import { ProfilePage } from './ProfilePage';

const reviews: ReviewRecord[] = [
  { skillId: 'chord', mastery: 35, intervalDays: 1, dueAt: '2026-07-12T08:00:00.000Z', consecutiveCorrect: 0 },
  { skillId: 'pitch', mastery: 72, intervalDays: 7, dueAt: '2026-07-18T08:00:00.000Z', consecutiveCorrect: 2 },
];

const attempts: AttemptRecord[] = [
  { id: 'new-chord-error', lessonId: 'chord-01', skillIds: ['chord', 'pitch'], correct: false, hints: 1, errorCode: 'wrong-third', createdAt: '2026-07-11T08:00:00.000Z' },
  { id: 'old-chord-error', lessonId: 'chord-01', skillIds: ['chord'], correct: false, hints: 0, errorCode: 'incomplete-voicing', createdAt: '2026-07-10T08:00:00.000Z' },
  { id: 'clean-pitch', lessonId: 'pitch-01', skillIds: ['pitch'], correct: true, hints: 0, createdAt: '2026-07-09T08:00:00.000Z' },
];

it('builds orbit mastery and recent errors from attempts and reviews', async () => {
  const user = userEvent.setup();
  render(<ProfilePage attempts={attempts} reviews={reviews} />);

  await user.click(screen.getByRole('button', { name: /和弦/ }));

  expect(screen.getByText('wrong-third、incomplete-voicing')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /和弦，掌握度 35%/ })).toBeInTheDocument();
});

it('renders a safe six-skill empty state without attempts or reviews', () => {
  render(<ProfilePage attempts={[]} reviews={[]} />);

  expect(screen.getAllByRole('button', { name: /掌握度/ })).toHaveLength(6);
  expect(screen.getByText('近期没有重复错误')).toBeInTheDocument();
  expect(screen.getByText('尚未安排')).toBeInTheDocument();
});
