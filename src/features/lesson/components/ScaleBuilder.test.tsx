import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ScaleBuilder } from './ScaleBuilder';

it('adds note names and reports the semitone distance', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<ScaleBuilder value={['C']} onChange={onChange} />);

  await user.click(screen.getByRole('button', { name: '添加 D' }));
  expect(onChange).toHaveBeenCalledWith(['C', 'D']);
  expect(screen.getByText('C → D · 2 半音')).toBeInTheDocument();
});

it('moves through note choices and adds one from the keyboard', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<ScaleBuilder value={[]} onChange={onChange} />);

  screen.getByRole('button', { name: '添加 C' }).focus();
  await user.keyboard('{ArrowRight}{Enter}');
  expect(onChange).toHaveBeenCalledWith(['D']);
});
