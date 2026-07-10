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

  if (!hydrated) {
    return (
      <main aria-busy="true" aria-label="正在载入拾音岛" className="app-loading" role="status">
        <strong>拾音岛</strong>
        <span>正在展开你的声音海图</span>
      </main>
    );
  }

  return (
    <AudioProvider>
      <AppRoutes />
    </AudioProvider>
  );
}
