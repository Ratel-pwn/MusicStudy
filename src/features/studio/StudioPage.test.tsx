import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { afterAll, beforeEach, vi } from 'vitest';
import type { Composition, CompositionIssue } from '../../domain/music/types';
import { ChordLane } from './components/ChordLane';
import { DrumSequencer } from './components/DrumSequencer';
import { PianoRoll } from './components/PianoRoll';
import { RuleInspector } from './components/RuleInspector';
import { TransportBar } from './components/TransportBar';
import { StudioPage, STUDIO_COMPOSITION_KEY, STUDIO_TRACK_KEY } from './StudioPage';
import { createStudioStore } from './studioStore';

const audio = vi.hoisted(() => ({
  engine: {
    playComposition: vi.fn(),
    stop: vi.fn(),
  },
  unlock: vi.fn(async () => undefined),
}));

const repository = vi.hoisted(() => ({
  get: vi.fn(),
  save: vi.fn(async (value: Composition) => value),
}));

const storage = new Map<string, string>();

vi.mock('../../audio/useAudio', () => ({
  useAudio: () => ({ engine: audio.engine, status: 'ready', unlock: audio.unlock, retry: audio.unlock }),
}));

vi.mock('../../data/repositories', () => ({ compositionRepository: repository }));

const composition = (overrides: Partial<Composition> = {}): Composition => ({
  id: 'studio-test',
  title: '测试草稿',
  bpm: 90,
  key: 'C-major',
  bars: 8,
  tracks: { drums: [], bass: [], chords: [], melody: [] },
  ...overrides,
});

describe('studio editors', () => {
  it('toggles a drum event by clicking the same sequencer cell', async () => {
    const user = userEvent.setup();
    const store = createStudioStore(composition());
    render(<DrumSequencer store={store} />);

    const cell = screen.getByRole('button', { name: '底鼓 第 1 拍' });
    await user.click(cell);
    expect(store.getState().composition.tracks.drums).toEqual([
      expect.objectContaining({ midi: 36, startBeat: 0, durationBeats: 0.25 }),
    ]);

    await user.click(cell);
    expect(store.getState().composition.tracks.drums).toEqual([]);
  });

  it('moves a selected piano-roll note with keyboard arrows and reveals contextual tools', async () => {
    const user = userEvent.setup();
    const store = createStudioStore(composition({
      tracks: {
        drums: [],
        bass: [],
        chords: [],
        melody: [{ id: 'melody-1', midi: 64, startBeat: 1, durationBeats: 1, velocity: 0.8 }],
      },
    }));
    render(<PianoRoll store={store} track="melody" />);

    const note = screen.getByRole('button', { name: '旋律音符 E4，位于第 2 拍' });
    expect(screen.queryByRole('toolbar', { name: '音符工具' })).not.toBeInTheDocument();
    await user.click(note);
    expect(screen.getByRole('toolbar', { name: '音符工具' })).toBeInTheDocument();

    await user.keyboard('{ArrowRight}{ArrowUp}');
    expect(store.getState().composition.tracks.melody[0]).toMatchObject({ midi: 65, startBeat: 1.25 });
  });

  it('adds notes to blank bass and melody tracks with pointer and keyboard controls, then moves them', async () => {
    const user = userEvent.setup();
    const store = createStudioStore(composition());
    const { rerender } = render(<PianoRoll store={store} track="bass" />);

    await user.click(screen.getByRole('button', { name: '在第 1 拍添加贝斯音符' }));
    expect(store.getState().composition.tracks.bass[0]).toMatchObject({ midi: 48, startBeat: 0 });
    expect(store.getState().selectedNoteId).toBe(store.getState().composition.tracks.bass[0].id);

    rerender(<PianoRoll store={store} track="melody" />);
    const addMelody = screen.getByRole('button', { name: '在第 2 拍添加旋律音符' });
    addMelody.focus();
    await user.keyboard('{Enter}');
    expect(store.getState().composition.tracks.melody[0]).toMatchObject({ midi: 60, startBeat: 1 });

    const melody = screen.getByRole('button', { name: '旋律音符 C4，位于第 2 拍' });
    melody.focus();
    await user.keyboard('{ArrowRight}{ArrowUp}');
    expect(store.getState().composition.tracks.melody[0]).toMatchObject({ midi: 61, startBeat: 1.25 });
  });

  it.each([
    ['C', 60],
    ['F', 65],
    ['G', 67],
    ['Am', 69],
  ] as const)('drops a %s chord fragment into a bar', (name, midi) => {
    const store = createStudioStore(composition());
    render(<ChordLane store={store} />);
    const transfer = {
      data: '',
      setData: vi.fn((_type: string, value: string) => { transfer.data = value; }),
      getData: vi.fn(() => transfer.data),
    };

    fireEvent.dragStart(screen.getByRole('button', { name: `${name} 和弦片段` }), { dataTransfer: transfer });
    fireEvent.drop(screen.getByRole('button', { name: '第 2 小节和弦区' }), { dataTransfer: transfer });

    const intervals = name === 'Am' ? [0, 3, 7] : [0, 4, 7];
    expect(store.getState().composition.tracks.chords.filter((note) => note.startBeat === 4)).toEqual(
      intervals.map((interval) => expect.objectContaining({ midi: midi + interval, durationBeats: 4 })),
    );
  });

  it('controls playback, stop, tempo, and loop position from the transport', async () => {
    const user = userEvent.setup();
    const store = createStudioStore(composition());
    const onPlay = vi.fn();
    const onStop = vi.fn();
    render(<TransportBar store={store} playing={false} onPlay={onPlay} onStop={onStop} />);

    await user.click(screen.getByRole('button', { name: '播放作品' }));
    await user.click(screen.getByRole('button', { name: '停止播放' }));
    await user.selectOptions(screen.getByRole('combobox', { name: '速度' }), '110');
    fireEvent.change(screen.getByRole('slider', { name: '循环位置' }), { target: { value: '12.5' } });

    expect(onPlay).toHaveBeenCalledOnce();
    expect(onStop).toHaveBeenCalledOnce();
    expect(store.getState().composition.bpm).toBe(110);
    expect(store.getState().playheadBeat).toBe(12.5);
  });

  it('focuses the issue track and beat when a rule suggestion is selected', async () => {
    const user = userEvent.setup();
    const store = createStudioStore(composition());
    const issues: CompositionIssue[] = [{
      code: 'missing-tonic-resolution',
      track: 'melody',
      beat: 28,
      message: '旋律结尾需要回到主音。',
    }];
    render(<RuleInspector issues={issues} store={store} />);

    await user.click(screen.getByRole('button', { name: /旋律结尾需要回到主音/ }));

    expect(store.getState()).toMatchObject({ selectedTrack: 'melody', focusedBeat: 28 });
  });
});

describe('StudioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    });
    repository.get.mockResolvedValue(undefined);
  });

  afterAll(() => vi.unstubAllGlobals());

  it('unlocks audio, plays the current composition, and stops from the transport', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await user.click(screen.getByRole('button', { name: '播放作品' }));
    expect(audio.unlock).toHaveBeenCalledOnce();
    expect(audio.engine.playComposition).toHaveBeenCalledWith(expect.objectContaining({ bars: 8 }));

    await user.click(screen.getByRole('button', { name: '停止播放' }));
    expect(audio.engine.stop).toHaveBeenCalledOnce();
  });

  it('debounces composition autosave for 500ms after an edit', async () => {
    vi.useFakeTimers();
    render(<StudioPage />);
    fireEvent.click(screen.getByRole('button', { name: '底鼓 第 1 拍' }));

    await act(async () => { vi.advanceTimersByTime(499); });
    expect(repository.save).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(repository.save).toHaveBeenCalledOnce();
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      tracks: expect.objectContaining({ drums: [expect.objectContaining({ midi: 36 })] }),
    }));
    vi.useRealTimers();
  });

  it('restores the most recent composition and selected mobile track after refresh', async () => {
    const restored = composition({
      id: 'remembered-song',
      title: '海风进行曲',
      tracks: {
        drums: [],
        bass: [],
        chords: [],
        melody: [{ id: 'last-note', midi: 69, startBeat: 28, durationBeats: 4, velocity: 0.8 }],
      },
    });
    localStorage.setItem(STUDIO_COMPOSITION_KEY, restored.id);
    localStorage.setItem(STUDIO_TRACK_KEY, 'melody');
    repository.get.mockResolvedValue(restored);

    render(<StudioPage />);

    expect(await screen.findByDisplayValue('海风进行曲')).toBeInTheDocument();
    expect(repository.get).toHaveBeenCalledWith('remembered-song');
    expect(screen.getByRole('button', { name: '在移动端查看旋律轨' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '旋律音符 A4，位于第 29 拍' })).toBeInTheDocument();
  });

  it('persists selected track immediately for the next refresh', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await user.click(screen.getByRole('button', { name: '在移动端查看和弦轨' }));

    expect(localStorage.getItem(STUDIO_TRACK_KEY)).toBe('chords');
  });

  it('shows a beat-zero marker when a rule suggestion focuses the first beat', async () => {
    const user = userEvent.setup();
    render(<StudioPage />);

    await user.click(screen.getByRole('button', { name: /drums track needs at least one event/ }));

    const marker = screen.getByRole('status', { name: '规则定位' });
    expect(marker).toHaveTextContent('已定位：第 1 拍');
    expect(marker).toHaveStyle({ left: '0%' });
  });

  it('moves the visible marker to a nonzero issue beat', async () => {
    const user = userEvent.setup();
    const restored = composition({
      id: 'focus-song',
      title: '聚焦作品',
      tracks: {
        drums: [],
        bass: [],
        chords: [{ id: 'c', midi: 60, startBeat: 28, durationBeats: 4, velocity: 0.8 }],
        melody: [{ id: 'ending', midi: 69, startBeat: 28, durationBeats: 4, velocity: 0.8 }],
      },
    });
    localStorage.setItem(STUDIO_COMPOSITION_KEY, restored.id);
    repository.get.mockResolvedValue(restored);
    render(<StudioPage />);
    await screen.findByDisplayValue('聚焦作品');

    await user.click(await screen.findByRole('button', { name: /The melody must finish on the tonic/ }));

    const marker = screen.getByRole('status', { name: '规则定位' });
    expect(marker).toHaveTextContent('已定位：第 29 拍');
    expect(marker).toHaveStyle({ left: '87.5%' });
  });
});
