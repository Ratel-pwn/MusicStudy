import { useEffect } from 'react';
import { AudioProvider } from '../audio/AudioProvider';
import { useProgressStore } from '../stores/useProgressStore';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { LoadingState } from '../shared/LoadingState';
import { AppRoutes } from './routes';

function AppContent() {
  const hydrated = useProgressStore((state) => state.hydrated);
  const hydrationError = useProgressStore((state) => state.hydrationError);
  const hydrate = useProgressStore((state) => state.hydrate);

  useEffect(() => {
    if (!hydrated && !hydrationError) void hydrate();
  }, [hydrate, hydrated, hydrationError]);

  if (hydrationError) throw hydrationError;

  if (!hydrated) {
    return <LoadingState label="正在载入拾音岛" />;
  }

  return (
    <AudioProvider>
      <AppRoutes />
    </AudioProvider>
  );
}

export function App() {
  return <ErrorBoundary><AppContent /></ErrorBoundary>;
}
