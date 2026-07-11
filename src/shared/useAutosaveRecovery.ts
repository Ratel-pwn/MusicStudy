import { useCallback, useEffect, useRef, useState } from 'react';

export type RecoverySnapshot = {
  fileName: string;
  json: string;
};

let latestRecoverySnapshot: RecoverySnapshot | null = null;

export function getLatestRecoverySnapshot(): RecoverySnapshot | null {
  return latestRecoverySnapshot;
}

export function hasLatestRecoverySnapshot(): boolean {
  return latestRecoverySnapshot !== null;
}

export function clearLatestRecoverySnapshot(): void {
  latestRecoverySnapshot = null;
}

export function downloadLatestRecoverySnapshot(): boolean {
  const snapshot = getLatestRecoverySnapshot();
  if (!snapshot || typeof document === 'undefined') return false;
  const url = URL.createObjectURL(new Blob([snapshot.json], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = snapshot.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}

type AutosaveRecoveryOptions<T> = {
  value: T;
  save(value: T): Promise<unknown>;
  fileName: string;
  delayMs?: number;
  enabled?: boolean;
};

export function useAutosaveRecovery<T>({
  value,
  save,
  fileName,
  delayMs = 500,
  enabled = true,
}: AutosaveRecoveryOptions<T>) {
  const valueRef = useRef(value);
  const saveRef = useRef(save);
  const enabledRef = useRef(enabled);
  const versionRef = useRef(0);
  const queuedVersionRef = useRef(-1);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingSavesRef = useRef(0);
  const mountedRef = useRef(true);
  const [error, setError] = useState<Error | null>(null);
  valueRef.current = value;
  saveRef.current = save;
  enabledRef.current = enabled;

  const persist = useCallback((): Promise<boolean> => {
    if (!enabledRef.current) return Promise.resolve(false);
    const version = versionRef.current;
    if (version <= queuedVersionRef.current) return queueRef.current.then(() => true);
    queuedVersionRef.current = version;
    const snapshot = valueRef.current;
    const execute = async () => {
      try {
        await saveRef.current(snapshot);
        if (mountedRef.current) setError(null);
      } catch (reason) {
        const nextError = reason instanceof Error ? reason : new Error(String(reason));
        if (mountedRef.current) setError(nextError);
        throw nextError;
      }
    };
    const run = pendingSavesRef.current === 0 ? execute() : queueRef.current.then(execute);
    pendingSavesRef.current += 1;
    queueRef.current = run.catch(() => undefined);
    void run.finally(() => { pendingSavesRef.current -= 1; }).catch(() => undefined);
    return run.then(() => true, () => false);
  }, []);

  useEffect(() => {
    const flush = () => { void persist(); };
    const handleVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      flush();
      mountedRef.current = false;
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [persist]);

  useEffect(() => {
    if (!enabled) return;
    versionRef.current += 1;
    latestRecoverySnapshot = { fileName, json: JSON.stringify(value, null, 2) };
    const timer = window.setTimeout(() => { void persist(); }, delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, enabled, fileName, persist, value]);

  return {
    error,
    retry: persist,
    downloadSnapshot: downloadLatestRecoverySnapshot,
  };
}
