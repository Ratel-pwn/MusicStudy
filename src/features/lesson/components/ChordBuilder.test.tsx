import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ChordBuilder } from './ChordBuilder';

it('adds chord tones and reports interval semitones from the root', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<ChordBuilder value={['C']} onChange={onChange} />);

  await user.click(screen.getByRole('button', { name: '添加 E' }));
  expect(onChange).toHaveBeenCalledWith(['C', 'E']);
  expect(screen.getByText('C → E · 4 半音')).toBeInTheDocument();
});

it('moves through chord tones and adds one from the keyboard', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<ChordBuilder value={[]} onChange={onChange} />);

  screen.getByRole('button', { name: '添加 C' }).focus();
  await user.keyboard('{ArrowRight}{Enter}');
  expect(onChange).toHaveBeenCalledWith(['D']);
});
