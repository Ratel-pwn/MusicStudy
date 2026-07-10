import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import type { Composition } from '../../domain/music/types';
import { HomePage } from './HomePage';

const audio = vi.hoisted(() => ({
  engine: { playMidi: vi.fn(), previewChord: vi.fn() },
  unlock: vi.fn(async () => undefined),
}));

vi.mock('../../audio/useAudio', () => ({
  useAudio: () => ({ engine: audio.engine, status: 'locked', unlock: audio.unlock, retry: audio.unlock }),
}));

const recentComposition: Composition = {
  id: 'harbor-lights',
  title: '港湾灯火',
  bpm: 90,
  key: 'C-major',
  bars: 8,
  tracks: { drums: [], bass: [], chords: [], melody: [] },
};

function renderHome(props: Partial<React.ComponentProps<typeof HomePage>> = {}) {
  return render(
    <MemoryRouter>
      <HomePage {...props} />
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  it('lets a first-time listener play middle C before revealing the start action', async () => {
    const user = userEvent.setup();
    renderHome();

    expect(screen.getByRole('button', { name: '播放中央 C' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '沿着声音出发' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '播放中央 C' }));

    expect(audio.unlock).toHaveBeenCalledOnce();
    expect(audio.engine.playMidi).toHaveBeenCalledWith(60, 1.2, 0.88);
    expect(audio.engine.previewChord).not.toHaveBeenCalled();
    expect(screen.getByRole('status', { name: '中央 C 的声音回应' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '沿着声音出发' })).toHaveAttribute('href', '/map');
  });

  it('answers middle C with E4, G4, and C5 in sequence and cancels pending notes on unmount', async () => {
    vi.useFakeTimers();
    audio.engine.playMidi.mockClear();
    const { unmount } = renderHome();

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '播放中央 C' })); });
    expect(audio.engine.playMidi.mock.calls.map(([midi]) => midi)).toEqual([60]);

    act(() => { vi.advanceTimersByTime(240); });
    expect(audio.engine.playMidi.mock.calls.map(([midi]) => midi)).toEqual([60, 64]);
    act(() => { vi.advanceTimersByTime(240); });
    expect(audio.engine.playMidi.mock.calls.map(([midi]) => midi)).toEqual([60, 64, 67]);

    act(() => { vi.advanceTimersByTime(240); });
    expect(audio.engine.playMidi.mock.calls.map(([midi]) => midi)).toEqual([60, 64, 67, 72]);

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '播放中央 C' })); });

    unmount();
    act(() => { vi.advanceTimersByTime(240); });
    expect(audio.engine.playMidi.mock.calls.map(([midi]) => midi)).toEqual([60, 64, 67, 72, 60]);
    vi.useRealTimers();
  });

  it('gives a returning learner direct access to the current lesson and recent work', () => {
    renderHome({ currentLessonId: 'pitch-middle-c', recentComposition, returning: true });

    expect(screen.getByRole('link', { name: /继续找到中央 C/ })).toHaveAttribute('href', '/lesson/pitch-middle-c');
    expect(screen.getByRole('link', { name: /继续港湾灯火/ })).toHaveAttribute('href', '/studio/harbor-lights');
  });

  it('replaces the current-course continuation after every playable lesson is complete', () => {
    renderHome({ foundationComplete: true, returning: true });

    expect(screen.getByRole('heading', { name: '基础航线已完成' })).toBeInTheDocument();
    expect(screen.queryByText('当前课程')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '进入今日练习' })).toHaveAttribute('href', '/practice');
    expect(screen.getByRole('link', { name: '打开八小节创作台' })).toHaveAttribute('href', '/studio/studio-draft');
  });
});
