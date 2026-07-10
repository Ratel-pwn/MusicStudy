import { useCallback, useEffect, useRef, useState } from 'react';

export type RecoverySnapshot = {
  fileName: string;
  json: string;
};

let latestRecoverySnapshot: RecoverySnapshot | null = null;

export function getLatestRecoverySnapshot(): RecoverySnapshot | null {
  return latestRecoverySnapshot;
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
  const mountedRef = useRef(true);
  const [error, setError] = useState<Error | null>(null);
  valueRef.current = value;

  const persist = useCallback(async () => {
    try {
      await save(valueRef.current);
      if (mountedRef.current) setError(null);
      return true;
    } catch (reason) {
      const nextError = reason instanceof Error ? reason : new Error(String(reason));
      if (mountedRef.current) setError(nextError);
      return false;
    }
  }, [save]);

  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    if (!enabled) return;
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
