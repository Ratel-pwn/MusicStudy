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

it('flushes the latest edit when leaving before debounce expires', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  const { rerender, unmount } = renderHook(({ value }) => useAutosaveRecovery({
    delayMs: 500,
    fileName: 'draft.json',
    save,
    value,
  }), { initialProps: { value: { title: 'first' } } });

  rerender({ value: { title: 'latest' } });
  unmount();
  await Promise.resolve();

  expect(save).toHaveBeenLastCalledWith({ title: 'latest' });
});

it('serializes retries so an older in-flight write cannot finish after a newer edit', async () => {
  let releaseFirst!: () => void;
  const first = new Promise<void>((resolve) => { releaseFirst = resolve; });
  const save = vi.fn().mockImplementationOnce(() => first).mockResolvedValue(undefined);
  const { result, rerender } = renderHook(({ value }) => useAutosaveRecovery({ value, save, fileName: 'draft.json' }), {
    initialProps: { value: { title: 'first' } },
  });

  void result.current.retry();
  rerender({ value: { title: 'latest' } });
  const second = result.current.retry();
  await Promise.resolve();
  expect(save).toHaveBeenCalledTimes(1);
  releaseFirst();
  await second;
  expect(save.mock.calls).toEqual([[{ title: 'first' }], [{ title: 'latest' }]]);
});

it('force-retries the same failed snapshot and clears the error after success', async () => {
  const value = { title: 'unchanged' };
  const save = vi.fn()
    .mockRejectedValueOnce(new Error('first write failed'))
    .mockResolvedValueOnce(undefined);
  const { result } = renderHook(() => useAutosaveRecovery({
    value,
    save,
    fileName: 'draft.json',
  }));

  await act(async () => { await result.current.retry(); });
  expect(result.current.error?.message).toBe('first write failed');
  await act(async () => { await result.current.retry(); });

  expect(save).toHaveBeenCalledTimes(2);
  expect(result.current.error).toBeNull();
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
