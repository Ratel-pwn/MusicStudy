import * as Tone from 'tone';
import type { Composition } from '../domain/music/types';
import type { TrackKind } from '../domain/music/types';

type TrackInstrument = Tone.NoiseSynth | Tone.MonoSynth | Tone.PolySynth | Tone.Synth;

export type AudioTestSpy = {
  unlockCalls: number;
  playedMidi: number[];
  playedCompositions: number;
  stopCalls: number;
};

declare global {
  var __MUSICSTUDY_AUDIO_TEST_SPY__: AudioTestSpy | undefined;
}

const audioTestSpy = () => import.meta.env.DEV ? globalThis.__MUSICSTUDY_AUDIO_TEST_SPY__ : undefined;

export type AudioStatus = 'locked' | 'unlocking' | 'ready' | 'failed';

export interface MusicAudioEngine {
  status: AudioStatus;
  unlock(): Promise<AudioStatus>;
  playMidi(midi: number, durationBeats?: number, velocity?: number): void;
  previewChord(midis: number[]): void;
  playSequence(midis: number[], intervalBeats?: number): void;
  startMetronome(bpm: number): void;
  playComposition(composition: Composition, options?: { startBeat?: number; onStop?: () => void }): void;
  stop(): void;
  dispose(): void;
}

const midiToNote = (midi: number) => Tone.Frequency(midi, 'midi').toNote();

export class AudioEngine implements MusicAudioEngine {
  status: AudioStatus = 'locked';

  private synth: Tone.Synth | null = null;
  private metronomeSynth: Tone.Synth | null = null;
  private trackSynths: Partial<Record<TrackKind, TrackInstrument>> = {};
  private trackChannels: Partial<Record<TrackKind, Tone.Channel>> = {};
  private onPlaybackStop?: () => void;
  private visibilityListenerRegistered = false;
  private disposed = false;

  async unlock(): Promise<AudioStatus> {
    this.status = 'unlocking';

    const spy = audioTestSpy();
    if (spy) {
      spy.unlockCalls += 1;
      this.status = 'ready';
      return this.status;
    }

    try {
      await Tone.start();
      if (!this.initializeResources()) throw new Error('Audio resources unavailable');
      this.status = 'ready';
    } catch {
      this.status = 'failed';
    }

    return this.status;
  }

  playMidi(midi: number, durationBeats = 1, velocity = 0.8): void {
    const spy = audioTestSpy();
    if (spy) {
      spy.playedMidi.push(midi);
      return;
    }
    this.synth?.triggerAttackRelease(midiToNote(midi), durationBeats, Tone.now(), velocity);
  }

  previewChord(midis: number[]): void {
    const spy = audioTestSpy();
    if (spy) {
      spy.playedMidi.push(...midis);
      return;
    }
    const time = Tone.now();
    midis.forEach((midi) => {
      this.synth?.triggerAttackRelease(midiToNote(midi), 1, time, 0.8);
    });
  }

  playSequence(midis: number[], intervalBeats = 1): void {
    const spy = audioTestSpy();
    if (spy) {
      spy.playedMidi.push(...midis);
      return;
    }
    this.stop();
    this.resetTransport();
    const secondsPerBeat = 60 / Tone.Transport.bpm.value;
    midis.forEach((midi, index) => {
      Tone.Transport.schedule((time) => {
        this.synth?.triggerAttackRelease(midiToNote(midi), intervalBeats * secondsPerBeat * .8, time, .8);
      }, index * intervalBeats * secondsPerBeat);
    });
    Tone.Transport.start(undefined, 0);
  }

  startMetronome(bpm: number): void {
    if (audioTestSpy()) return;
    this.stop();
    this.resetTransport();
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.scheduleRepeat((time) => {
      this.metronomeSynth?.triggerAttackRelease('C6', '32n', time, 0.7);
    }, '4n');
    Tone.Transport.start(undefined, 0);
  }

  playComposition(composition: Composition, options: { startBeat?: number; onStop?: () => void } = {}): void {
    this.stop();
    this.resetTransport();
    this.onPlaybackStop = options.onStop;
    const spy = audioTestSpy();
    if (spy) {
      spy.playedCompositions += 1;
      return;
    }
    Tone.Transport.bpm.value = composition.bpm;
    const secondsPerBeat = 60 / composition.bpm;

    (Object.entries(composition.tracks) as Array<[TrackKind, Composition['tracks'][TrackKind]]>).forEach(([track, events]) => {
      events.forEach((noteEvent) => {
        Tone.Transport.schedule((time) => {
          if (track === 'drums') {
            (this.trackSynths.drums as Tone.NoiseSynth | undefined)?.triggerAttackRelease(
              noteEvent.durationBeats * secondsPerBeat,
              time,
              noteEvent.velocity,
            );
          } else {
            (this.trackSynths[track] as Tone.MonoSynth | Tone.PolySynth | Tone.Synth | undefined)?.triggerAttackRelease(
              midiToNote(noteEvent.midi),
              noteEvent.durationBeats * secondsPerBeat,
              time,
              noteEvent.velocity,
            );
          }
        }, noteEvent.startBeat * secondsPerBeat);
      });
    });
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = composition.bars * 4 * secondsPerBeat;
    Tone.Transport.start(undefined, (options.startBeat ?? 0) * secondsPerBeat);
  }

  stop(): void {
    const spy = audioTestSpy();
    if (spy) {
      spy.stopCalls += 1;
      const callback = this.onPlaybackStop;
      this.onPlaybackStop = undefined;
      callback?.();
      return;
    }
    if (!this.synth && !this.metronomeSynth && Object.keys(this.trackSynths).length === 0) {
      const callback = this.onPlaybackStop;
      this.onPlaybackStop = undefined;
      callback?.();
      return;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    const callback = this.onPlaybackStop;
    this.onPlaybackStop = undefined;
    callback?.();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (audioTestSpy()) return;
    if (this.synth || this.metronomeSynth || this.visibilityListenerRegistered) this.stop();
    if (this.visibilityListenerRegistered) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      this.visibilityListenerRegistered = false;
    }
    this.synth?.dispose();
    this.metronomeSynth?.dispose();
    Object.values(this.trackSynths).forEach((synth) => synth.dispose());
    Object.values(this.trackChannels).forEach((channel) => channel.dispose());
    this.trackSynths = {};
    this.trackChannels = {};
    this.synth = null;
    this.metronomeSynth = null;
  }

  private initializeResources(): boolean {
    if (this.disposed) return false;
    if (this.synth && this.metronomeSynth && Object.keys(this.trackSynths).length === 4 && Object.keys(this.trackChannels).length === 4) return true;

    let synth: Tone.Synth | null = null;
    let metronomeSynth: Tone.Synth | null = null;
    const trackChannels: Partial<Record<TrackKind, Tone.Channel>> = {};
    const trackSynths: Partial<Record<TrackKind, TrackInstrument>> = {};
    try {
      synth = new Tone.Synth();
      synth.toDestination();
      metronomeSynth = new Tone.Synth();
      metronomeSynth.toDestination();
      (['drums', 'bass', 'chords', 'melody'] as TrackKind[]).forEach((track) => {
        const channel = new Tone.Channel().toDestination();
        trackChannels[track] = channel;
      });
      trackSynths.drums = new Tone.NoiseSynth();
      trackSynths.bass = new Tone.MonoSynth();
      trackSynths.chords = new Tone.PolySynth(Tone.Synth);
      trackSynths.melody = new Tone.Synth();
      (Object.keys(trackSynths) as TrackKind[]).forEach((track) => trackSynths[track]?.connect(trackChannels[track]!));
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      this.synth = synth;
      this.metronomeSynth = metronomeSynth;
      this.trackSynths = trackSynths;
      this.trackChannels = trackChannels;
      this.visibilityListenerRegistered = true;
      return true;
    } catch {
      synth?.dispose();
      metronomeSynth?.dispose();
      Object.values(trackSynths).forEach((node) => node.dispose());
      Object.values(trackChannels).forEach((channel) => channel.dispose());
      return false;
    }
  }

  private readonly handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') this.stop();
  };

  private resetTransport(): void {
    Tone.Transport.loop = false;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = 0;
    Tone.Transport.position = 0;
  }
}
