import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { AudioRecoveryBanner } from './AudioRecoveryBanner';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingState } from './LoadingState';

function ThrowingChild(): never {
  throw new Error('render failed');
}

describe('ErrorBoundary', () => {
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
