import { act, renderHook } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

import { getLatestRecoverySnapshot, useAutosaveRecovery } from './useAutosaveRecovery';
import { useReducedMotion } from './useReducedMotion';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('keeps a serialized composition snapshot when autosave fails', async () => {
  vi.useFakeTimers();
  const save = vi.fn(async () => { throw new Error('IndexedDB unavailable'); });
  const composition = { id: 'draft', title: '临时作品', tracks: { drums: [] } };

  const { result } = renderHook(() => useAutosaveRecovery({
    delayMs: 500,
    fileName: '临时作品.json',
    save,
    value: composition,
  }));

  expect(getLatestRecoverySnapshot()).toEqual({
    fileName: '临时作品.json',
    json: JSON.stringify(composition, null, 2),
  });

  await act(async () => { await vi.advanceTimersByTimeAsync(500); });

  expect(save).toHaveBeenCalledWith(composition);
  expect(result.current.error?.message).toBe('IndexedDB unavailable');
});

it('tracks changes to the reduced-motion media query', () => {
  let listener: ((event: MediaQueryListEvent) => void) | undefined;
  const media = {
    matches: true,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn((_type: string, next: (event: MediaQueryListEvent) => void) => { listener = next; }),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;
  vi.stubGlobal('matchMedia', vi.fn(() => media));

  const { result } = renderHook(() => useReducedMotion());
  expect(result.current).toBe(true);

  act(() => listener?.({ matches: false } as MediaQueryListEvent));
  expect(result.current).toBe(false);
});
