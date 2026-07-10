import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SkillOrbit, type SkillOrbitItem } from './SkillOrbit';

const skills: SkillOrbitItem[] = [
  { id: 'pitch', label: '音高', mastery: 82, dueAt: '2026-07-14T08:00:00.000Z', recentErrors: ['中央 C 定位'], recommendedPractice: '白键定位' },
  { id: 'rhythm', label: '节奏', mastery: 44, dueAt: '2026-07-12T08:00:00.000Z', recentErrors: ['八分音符抢拍'], recommendedPractice: '四拍脉搏' },
  { id: 'keyboard', label: '键盘', mastery: 66, dueAt: '2026-07-16T08:00:00.000Z', recentErrors: [], recommendedPractice: '高低音辨认' },
  { id: 'scale', label: '音阶', mastery: 58, dueAt: '2026-07-15T08:00:00.000Z', recentErrors: ['漏掉 B 音'], recommendedPractice: 'C 大调上行' },
  { id: 'chord', label: '和弦', mastery: 35, dueAt: '2026-07-12T08:00:00.000Z', recentErrors: ['三音误选 F'], recommendedPractice: 'C–E–G 堆叠' },
  { id: 'creation', label: '创作', mastery: 71, dueAt: '2026-07-18T08:00:00.000Z', recentErrors: ['结尾未收束'], recommendedPractice: '改写第八小节' },
];

it('places six labelled skills on the orbit and reveals selected evidence', async () => {
  const user = userEvent.setup();
  render(<SkillOrbit skills={skills} />);

  const nodes = screen.getAllByRole('button', { name: /掌握度/ });
  expect(nodes).toHaveLength(6);
  expect(nodes.map((node) => node.getAttribute('data-orbit-position'))).toEqual(['0', '1', '2', '3', '4', '5']);
  expect(screen.getByRole('button', { name: /和弦.*需加固/ })).toHaveAttribute('data-line-style', 'dashed');

  await user.click(screen.getByRole('button', { name: /和弦/ }));

  expect(screen.getByText('7月12日')).toBeInTheDocument();
  expect(screen.getByText('三音误选 F')).toBeInTheDocument();
  expect(screen.getByText('C–E–G 堆叠')).toBeInTheDocument();
});
