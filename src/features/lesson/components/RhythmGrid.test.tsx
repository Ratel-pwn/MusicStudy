import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { RhythmGrid } from './RhythmGrid';

it('places a rhythm value by dragging it onto a beat', () => {
  const onChange = vi.fn();
  render(<RhythmGrid value={[]} onChange={onChange} />);
  const quarter = screen.getByRole('button', { name: '四分音符' });
  const beat = screen.getByRole('button', { name: '第 1 拍，空' });
  const dataTransfer = { setData: vi.fn(), getData: vi.fn(() => 'quarter') };

  fireEvent.dragStart(quarter, { dataTransfer });
  fireEvent.dragOver(beat, { dataTransfer });
  fireEvent.drop(beat, { dataTransfer });

  expect(onChange).toHaveBeenCalledWith(['quarter', null, null, null]);
});

it('selects a value and places it on a beat with the keyboard', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<RhythmGrid value={[]} onChange={onChange} />);

  await user.click(screen.getByRole('button', { name: '八分音符' }));
  screen.getByRole('button', { name: '第 1 拍，空' }).focus();
  await user.keyboard('{ArrowRight}{Enter}');

  expect(screen.getByRole('button', { name: '第 2 拍，空' })).toHaveFocus();
  expect(onChange).toHaveBeenCalledWith([null, 'eighth', null, null]);
});

it('places the selected rhythm with Space', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<RhythmGrid value={[]} onChange={onChange} />);

  screen.getByRole('button', { name: '第 1 拍，空' }).focus();
  await user.keyboard(' ');

  expect(onChange).toHaveBeenCalledWith(['quarter', null, null, null]);
});

it('renders the requested number of rhythm cells', () => {
  render(<RhythmGrid length={6} value={[]} onChange={vi.fn()} />);

  expect(screen.getAllByRole('button', { name: /第 \d 拍，空/ })).toHaveLength(6);
});
