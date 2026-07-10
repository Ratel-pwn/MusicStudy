import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { AudioEngine, type AudioStatus, type MusicAudioEngine } from './AudioEngine';

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

  useEffect(() => () => engine.dispose(), [engine]);

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
      {status === 'failed' && (
        <div role="alert">
          <button type="button" onClick={() => void unlock()}>
            声音暂不可用，重试
          </button>
        </div>
      )}
      {children}
    </AudioContext.Provider>
  );
}
