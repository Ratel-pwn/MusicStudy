import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, Fragment, type PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Composition } from '../domain/music/types';
import { AudioEngine } from './AudioEngine';
import { AudioProvider } from './AudioProvider';
import { useAudio } from './useAudio';

const tone = vi.hoisted(() => {
  const synths: Array<{
    triggerAttackRelease: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
    toDestination: ReturnType<typeof vi.fn>;
  }> = [];
  const transport = {
    bpm: { value: 120 },
    schedule: vi.fn((callback: (time: number) => void) => {
      callback(42);
      return 1;
    }),
    scheduleRepeat: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    cancel: vi.fn(),
  };

  return {
    start: vi.fn(),
    now: vi.fn(() => 12),
    Frequency: vi.fn((midi: number) => ({
      toNote: () => new Map([[60, 'C4'], [64, 'E4'], [67, 'G4']]).get(midi) ?? `midi-${midi}`,
    })),
    Synth: vi.fn(function MockSynth() {
      const synth = {
        triggerAttackRelease: vi.fn(),
        dispose: vi.fn(),
        toDestination: vi.fn(),
      };
      synth.toDestination.mockReturnValue(synth);
      synths.push(synth);
      return synth;
    }),
    Transport: transport,
    synths,
  };
});

vi.mock('tone', () => tone);

const composition: Composition = {
  id: 'demo',
  title: 'Demo',
  bpm: 90,
  key: 'C-major',
  bars: 8,
  tracks: {
    drums: [],
    bass: [{ id: 'bass-1', midi: 48, startBeat: 0, durationBeats: 1, velocity: 0.7 }],
    chords: [{ id: 'chord-1', midi: 60, startBeat: 2, durationBeats: 2, velocity: 0.8 }],
    melody: [],
  },
};

const engines: AudioEngine[] = [];

function createEngine() {
  const engine = new AudioEngine();
  engines.push(engine);
  return engine;
}

function AudioConsumer() {
  const { status, unlock, retry } = useAudio();
  return createElement(
    Fragment,
    null,
    createElement('output', null, status),
    createElement('button', { onClick: () => void unlock() }, 'unlock'),
    createElement('button', { onClick: () => void retry() }, 'retry consumer'),
  );
}

function Provider({ children }: PropsWithChildren) {
  return createElement(AudioProvider, null, children);
}

describe('AudioEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tone.synths.length = 0;
    tone.Transport.bpm.value = 120;
    tone.start.mockResolvedValue(undefined);
  });

  afterEach(() => {
    engines.splice(0).forEach((engine) => engine.dispose());
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  });

  it('unlocks Tone and plays a MIDI note through the fallback synth', async () => {
    const engine = createEngine();
    await expect(engine.unlock()).resolves.toBe('ready');

    engine.playMidi(60, 0.5);

    expect(tone.start).toHaveBeenCalledOnce();
    expect(tone.synths[0].triggerAttackRelease).toHaveBeenCalledWith('C4', 0.5, expect.anything(), expect.anything());
  });

  it('previews a chord at one shared audio time', () => {
    const engine = createEngine();
    engine.previewChord([60, 64, 67]);

    expect(tone.synths[0].triggerAttackRelease).toHaveBeenCalledTimes(3);
    expect(tone.synths[0].triggerAttackRelease).toHaveBeenNthCalledWith(1, 'C4', 1, 12, 0.8);
    expect(tone.synths[0].triggerAttackRelease).toHaveBeenNthCalledWith(2, 'E4', 1, 12, 0.8);
    expect(tone.synths[0].triggerAttackRelease).toHaveBeenNthCalledWith(3, 'G4', 1, 12, 0.8);
  });

  it('starts a metronome on the shared Transport', () => {
    const engine = createEngine();
    tone.Transport.scheduleRepeat.mockImplementationOnce((callback: (time: number) => void) => {
      callback(24);
      return 2;
    });

    engine.startMetronome(96);

    expect(tone.Transport.bpm.value).toBe(96);
    expect(tone.Transport.scheduleRepeat).toHaveBeenCalledWith(expect.any(Function), '4n');
    expect(tone.synths[1].triggerAttackRelease).toHaveBeenCalledWith('C6', '32n', 24, 0.7);
    expect(tone.Transport.start).toHaveBeenCalledOnce();
  });

  it('schedules every composition note using beat-derived Transport times', () => {
    const engine = createEngine();

    engine.playComposition(composition);

    expect(tone.Transport.stop).toHaveBeenCalledOnce();
    expect(tone.Transport.cancel).toHaveBeenCalledOnce();
    expect(tone.Transport.bpm.value).toBe(90);
    expect(tone.Transport.schedule).toHaveBeenNthCalledWith(1, expect.any(Function), 0);
    expect(tone.Transport.schedule).toHaveBeenNthCalledWith(2, expect.any(Function), 4 / 3);
    expect(tone.synths[0].triggerAttackRelease).toHaveBeenNthCalledWith(1, 'midi-48', 2 / 3, 42, 0.7);
    expect(tone.synths[0].triggerAttackRelease).toHaveBeenNthCalledWith(2, 'C4', 4 / 3, 42, 0.8);
    expect(tone.Transport.start).toHaveBeenCalledOnce();
  });

  it('stops, cancels, and disposes all owned audio resources', () => {
    const engine = createEngine();

    engine.stop();
    engine.dispose();

    expect(tone.Transport.stop).toHaveBeenCalledTimes(2);
    expect(tone.Transport.cancel).toHaveBeenCalledTimes(2);
    expect(tone.synths[0].dispose).toHaveBeenCalledOnce();
    expect(tone.synths[1].dispose).toHaveBeenCalledOnce();
  });

  it('stops playback when the page becomes hidden', () => {
    createEngine();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });

    fireEvent(document, new Event('visibilitychange'));

    expect(tone.Transport.stop).toHaveBeenCalledOnce();
    expect(tone.Transport.cancel).toHaveBeenCalledOnce();
  });
});

describe('AudioProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tone.synths.length = 0;
    tone.start.mockResolvedValue(undefined);
  });

  it('exposes successful unlock state to consumers', async () => {
    const user = userEvent.setup();
    render(createElement(AudioConsumer), { wrapper: Provider });

    await user.click(screen.getByRole('button', { name: 'unlock' }));

    expect(screen.getByText('ready')).toBeInTheDocument();
  });

  it('keeps children rendered after failure and retries from the fallback action', async () => {
    const user = userEvent.setup();
    tone.start.mockRejectedValueOnce(new Error('audio denied')).mockResolvedValueOnce(undefined);
    render(createElement(AudioConsumer), { wrapper: Provider });

    await user.click(screen.getByRole('button', { name: 'unlock' }));

    expect(screen.getByText('failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '声音暂不可用，重试' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'retry consumer' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '声音暂不可用，重试' }));
    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(tone.start).toHaveBeenCalledTimes(2);
  });
});
