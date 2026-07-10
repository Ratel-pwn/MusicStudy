import { useEffect } from 'react';
import { AudioProvider } from '../audio/AudioProvider';
import { useProgressStore } from '../stores/useProgressStore';
import { AppRoutes } from './routes';

export function App() {
  const hydrated = useProgressStore((state) => state.hydrated);
  const hydrate = useProgressStore((state) => state.hydrate);

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrate, hydrated]);

  return (
    <AudioProvider>
      <AppRoutes />
    </AudioProvider>
  );
}
