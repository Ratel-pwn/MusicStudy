import { useContext } from 'react';
import { AudioContext, type AudioContextValue } from './AudioProvider';

export function useAudio(): AudioContextValue {
  const value = useContext(AudioContext);
  if (!value) throw new Error('useAudio must be used within an AudioProvider');
  return value;
}
