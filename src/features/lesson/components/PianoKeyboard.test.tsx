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

it('plays a focused key with Space', async () => {
  const user = userEvent.setup();
  const onPlay = vi.fn();
  render(<PianoKeyboard value={[]} onPlay={onPlay} onChange={vi.fn()} />);

  screen.getByRole('button', { name: 'C4' }).focus();
  await user.keyboard(' ');

  expect(onPlay).toHaveBeenCalledWith(60);
});

it('renders a specified cross-octave MIDI collection', () => {
  render(<PianoKeyboard midis={[48, 59, 60, 72, 84]} value={[]} onPlay={vi.fn()} onChange={vi.fn()} />);

  ['C3', 'B3', 'C4', 'C5', 'C6'].forEach((name) => {
    expect(screen.getByRole('button', { name })).toBeInTheDocument();
  });
});
