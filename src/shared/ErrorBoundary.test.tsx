import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { AudioRecoveryBanner } from './AudioRecoveryBanner';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingState } from './LoadingState';
import { clearLatestRecoverySnapshot, useAutosaveRecovery } from './useAutosaveRecovery';

function ThrowingChild(): never {
  throw new Error('render failed');
}

describe('ErrorBoundary', () => {
  beforeEach(() => clearLatestRecoverySnapshot());

  it('renders a supplied fallback when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary fallback={<button type="button">恢复学习</button>}>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: '恢复学习' })).toBeInTheDocument();
  });

  it('offers map, last-step, and temporary-work recovery actions', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const onReturnToMap = vi.fn();
    const onRestoreLastStep = vi.fn();
    const onExportTemporaryWork = vi.fn();

    render(
      <ErrorBoundary
        onExportTemporaryWork={onExportTemporaryWork}
        onRestoreLastStep={onRestoreLastStep}
        onReturnToMap={onReturnToMap}
      >
        <ThrowingChild />
      </ErrorBoundary>,
    );

    await user.click(screen.getByRole('button', { name: '返回地图' }));
    await user.click(screen.getByRole('button', { name: '恢复最近步骤' }));
    await user.click(screen.getByRole('button', { name: '导出临时作品' }));

    expect(onReturnToMap).toHaveBeenCalledOnce();
    expect(onRestoreLastStep).toHaveBeenCalledOnce();
    expect(onExportTemporaryWork).toHaveBeenCalledOnce();
  });

  it('does not offer a dead default export action without a snapshot', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<ErrorBoundary><ThrowingChild /></ErrorBoundary>);

    expect(screen.queryByRole('button', { name: '导出临时作品' })).not.toBeInTheDocument();
    expect(screen.getByText('当前没有可导出的临时作品。')).toBeInTheDocument();
  });

  it('downloads the latest snapshot from the real default export action', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => 'blob:recovery');
    const revokeObjectURL = vi.fn();
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: createObjectURL },
      revokeObjectURL: { configurable: true, value: revokeObjectURL },
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const { unmount } = renderHook(() => useAutosaveRecovery({
      delayMs: 60_000,
      fileName: '临时作品.json',
      save: async () => undefined,
      value: { id: 'recover-me' },
    }));
    unmount();

    render(<ErrorBoundary><ThrowingChild /></ErrorBoundary>);
    await user.click(screen.getByRole('button', { name: '导出临时作品' }));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:recovery');
  });
});

describe('AudioRecoveryBanner', () => {
  it('retries failed audio without hiding the rest of the interface', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(
      <>
        <AudioRecoveryBanner status="failed" onRetry={retry} />
        <button type="button">继续无声学习</button>
      </>,
    );

    await user.click(screen.getByRole('button', { name: '重新启用声音' }));

    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: '继续无声学习' })).toBeEnabled();
  });
});

it('announces a loading state without taking keyboard focus', () => {
  render(<LoadingState label="正在恢复学习进度" />);

  expect(screen.getByRole('status', { name: '正在恢复学习进度' })).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByRole('status')).not.toHaveAttribute('tabindex');
});
