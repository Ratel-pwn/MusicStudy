import { createContext, useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AudioEngine, type AudioStatus, type MusicAudioEngine } from './AudioEngine';
import { AudioRecoveryBanner } from '../shared/AudioRecoveryBanner';

export type AudioContextValue = {
  engine: MusicAudioEngine;
  status: AudioStatus;
  unlock(): Promise<void>;
  retry(): Promise<void>;
};

export const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: PropsWithChildren) {
  const [engine] = useState<MusicAudioEngine>(() => new AudioEngine());
  const [status, setStatus] = useState<AudioStatus>(engine.status);
  const disposePending = useRef(false);

  useEffect(() => {
    disposePending.current = false;
    return () => {
      disposePending.current = true;
      queueMicrotask(() => {
        if (disposePending.current) engine.dispose();
      });
    };
  }, [engine]);

  const unlock = useCallback(async () => {
    setStatus('unlocking');
    setStatus(await engine.unlock());
  }, [engine]);

  const value = useMemo<AudioContextValue>(() => ({
    engine,
    status,
    unlock,
    retry: unlock,
  }), [engine, status, unlock]);

  return (
    <AudioContext.Provider value={value}>
      <AudioRecoveryBanner status={status} onRetry={unlock} />
      {children}
    </AudioContext.Provider>
  );
}
