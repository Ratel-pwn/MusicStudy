import * as Tone from 'tone';
import type { Composition } from '../domain/music/types';
import type { TrackKind } from '../domain/music/types';

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
  private trackSynths: Partial<Record<TrackKind, Tone.Synth>> = {};
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
    const secondsPerBeat = 60 / Tone.Transport.bpm.value;
    midis.forEach((midi, index) => {
      Tone.Transport.schedule((time) => {
        this.synth?.triggerAttackRelease(midiToNote(midi), intervalBeats * secondsPerBeat * .8, time, .8);
      }, index * intervalBeats * secondsPerBeat);
    });
    Tone.Transport.start();
  }

  startMetronome(bpm: number): void {
    if (audioTestSpy()) return;
    this.stop();
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.scheduleRepeat((time) => {
      this.metronomeSynth?.triggerAttackRelease('C6', '32n', time, 0.7);
    }, '4n');
    Tone.Transport.start();
  }

  playComposition(composition: Composition, options: { startBeat?: number; onStop?: () => void } = {}): void {
    this.onPlaybackStop = options.onStop;
    const spy = audioTestSpy();
    if (spy) {
      spy.playedCompositions += 1;
      return;
    }
    this.stop();
    Tone.Transport.bpm.value = composition.bpm;
    const secondsPerBeat = 60 / composition.bpm;

    (Object.entries(composition.tracks) as Array<[TrackKind, Composition['tracks'][TrackKind]]>).forEach(([track, events]) => {
      events.forEach((noteEvent) => {
        Tone.Transport.schedule((time) => {
          this.trackSynths[track]?.triggerAttackRelease(
            midiToNote(noteEvent.midi),
            noteEvent.durationBeats * secondsPerBeat,
            time,
            noteEvent.velocity,
          );
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
    this.trackSynths = {};
    this.synth = null;
    this.metronomeSynth = null;
  }

  private initializeResources(): boolean {
    if (this.disposed) return false;
    if (this.synth && this.metronomeSynth && Object.keys(this.trackSynths).length === 4) return true;

    let synth: Tone.Synth | null = null;
    let metronomeSynth: Tone.Synth | null = null;
    try {
      synth = new Tone.Synth();
      synth.toDestination();
      metronomeSynth = new Tone.Synth();
      metronomeSynth.toDestination();
      const trackSynths = Object.fromEntries((['drums', 'bass', 'chords', 'melody'] as TrackKind[]).map((track) => {
        const node = new Tone.Synth();
        node.toDestination();
        return [track, node];
      })) as Record<TrackKind, Tone.Synth>;
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      this.synth = synth;
      this.metronomeSynth = metronomeSynth;
      this.trackSynths = trackSynths;
      this.visibilityListenerRegistered = true;
      return true;
    } catch {
      synth?.dispose();
      metronomeSynth?.dispose();
      Object.values(this.trackSynths).forEach((node) => node.dispose());
      this.trackSynths = {};
      return false;
    }
  }

  private readonly handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') this.stop();
  };
}
