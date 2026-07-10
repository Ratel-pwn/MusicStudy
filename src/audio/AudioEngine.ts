import * as Tone from 'tone';
import type { Composition } from '../domain/music/types';

export type AudioStatus = 'locked' | 'unlocking' | 'ready' | 'failed';

export interface MusicAudioEngine {
  status: AudioStatus;
  unlock(): Promise<AudioStatus>;
  playMidi(midi: number, durationBeats?: number, velocity?: number): void;
  previewChord(midis: number[]): void;
  startMetronome(bpm: number): void;
  playComposition(composition: Composition): void;
  stop(): void;
  dispose(): void;
}

const midiToNote = (midi: number) => Tone.Frequency(midi, 'midi').toNote();

export class AudioEngine implements MusicAudioEngine {
  status: AudioStatus = 'locked';

  private readonly synth = new Tone.Synth().toDestination();
  private readonly metronomeSynth = new Tone.Synth().toDestination();
  private disposed = false;

  constructor() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  async unlock(): Promise<AudioStatus> {
    this.status = 'unlocking';

    try {
      await Tone.start();
      this.status = 'ready';
    } catch {
      this.status = 'failed';
    }

    return this.status;
  }

  playMidi(midi: number, durationBeats = 1, velocity = 0.8): void {
    this.synth.triggerAttackRelease(midiToNote(midi), durationBeats, Tone.now(), velocity);
  }

  previewChord(midis: number[]): void {
    const time = Tone.now();
    midis.forEach((midi) => {
      this.synth.triggerAttackRelease(midiToNote(midi), 1, time, 0.8);
    });
  }

  startMetronome(bpm: number): void {
    this.stop();
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.scheduleRepeat((time) => {
      this.metronomeSynth.triggerAttackRelease('C6', '32n', time, 0.7);
    }, '4n');
    Tone.Transport.start();
  }

  playComposition(composition: Composition): void {
    this.stop();
    Tone.Transport.bpm.value = composition.bpm;
    const secondsPerBeat = 60 / composition.bpm;

    Object.values(composition.tracks).flat().forEach((noteEvent) => {
      Tone.Transport.schedule((time) => {
        this.synth.triggerAttackRelease(
          midiToNote(noteEvent.midi),
          noteEvent.durationBeats * secondsPerBeat,
          time,
          noteEvent.velocity,
        );
      }, noteEvent.startBeat * secondsPerBeat);
    });

    Tone.Transport.start();
  }

  stop(): void {
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.synth.dispose();
    this.metronomeSynth.dispose();
  }

  private readonly handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') this.stop();
  };
}
