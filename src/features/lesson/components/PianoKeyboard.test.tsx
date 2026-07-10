import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PianoKeyboard } from './PianoKeyboard';

it('plays and selects a note with the pointer', async () => {
  const user = userEvent.setup();
  const onPlay = vi.fn();
  const onChange = vi.fn();
  render(<PianoKeyboard value={[]} onPlay={onPlay} onChange={onChange} />);

  await user.click(screen.getByRole('button', { name: 'C4' }));
  expect(onPlay).toHaveBeenCalledWith(60);
  expect(onChange).toHaveBeenCalledWith([60]);
});

it('moves across keys and plays the focused note from the keyboard', async () => {
  const user = userEvent.setup();
  const onPlay = vi.fn();
  render(<PianoKeyboard value={[]} onPlay={onPlay} onChange={vi.fn()} />);

  screen.getByRole('button', { name: 'C4' }).focus();
  await user.keyboard('{ArrowRight}{Enter}');

  expect(screen.getByRole('button', { name: 'C#4' })).toHaveFocus();
  expect(onPlay).toHaveBeenCalledWith(61);
});
