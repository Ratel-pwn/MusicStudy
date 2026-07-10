import type { AudioStatus } from '../audio/AudioEngine';

type AudioRecoveryBannerProps = {
  status: AudioStatus;
  onRetry(): void | Promise<void>;
};

export function AudioRecoveryBanner({ status, onRetry }: AudioRecoveryBannerProps) {
  if (status !== 'failed') return null;

  return (
    <aside className="audio-recovery-banner" role="status">
      <span>声音暂时不可用，你仍可继续学习。</span>
      <button type="button" onClick={() => void onRetry()}>重新启用声音</button>
    </aside>
  );
}
