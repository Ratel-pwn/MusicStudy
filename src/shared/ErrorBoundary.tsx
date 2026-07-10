import { Component, type ErrorInfo, type ReactNode } from 'react';
import { downloadLatestRecoverySnapshot } from './useAutosaveRecovery';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onReturnToMap?(): void;
  onRestoreLastStep?(): void;
  onExportTemporaryWork?(): void;
};

type ErrorBoundaryState = { error: Error | null };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('MusicStudy render recovery', error, info.componentStack);
  }

  private readonly returnToMap = () => {
    if (this.props.onReturnToMap) this.props.onReturnToMap();
    else window.location.assign('/map');
  };

  private readonly restoreLastStep = () => {
    if (this.props.onRestoreLastStep) this.props.onRestoreLastStep();
    else window.location.reload();
  };

  private readonly exportTemporaryWork = () => {
    if (this.props.onExportTemporaryWork) this.props.onExportTemporaryWork();
    else downloadLatestRecoverySnapshot();
  };

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <main className="error-recovery" role="alert">
        <div>
          <p>这一步没有顺利打开</p>
          <h1>你的学习进度仍在本机</h1>
          <span>可以返回地图、从最近步骤重试，或先导出临时作品。</span>
          <div className="error-recovery-actions">
            <button type="button" onClick={this.returnToMap}>返回地图</button>
            <button type="button" onClick={this.restoreLastStep}>恢复最近步骤</button>
            <button type="button" onClick={this.exportTemporaryWork}>导出临时作品</button>
          </div>
        </div>
      </main>
    );
  }
}
