import { useEffect } from 'react';
import { AudioProvider } from '../audio/AudioProvider';
import { useProgressStore } from '../stores/useProgressStore';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { LoadingState } from '../shared/LoadingState';
import { AppRoutes } from './routes';

export function App() {
  const hydrated = useProgressStore((state) => state.hydrated);
  const hydrate = useProgressStore((state) => state.hydrate);

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrate, hydrated]);

  if (!hydrated) {
    return <LoadingState label="正在载入拾音岛" />;
  }

  return (
    <ErrorBoundary>
      <AudioProvider>
        <AppRoutes />
      </AudioProvider>
    </ErrorBoundary>
  );
}
