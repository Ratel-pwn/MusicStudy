import { CheckCircle, Crosshair } from '@phosphor-icons/react';
import type { StoreApi } from 'zustand/vanilla';
import type { CompositionIssue } from '../../../domain/music/types';
import type { StudioState } from '../studioStore';

const TRACK_LABELS = { drums: '鼓', bass: '贝斯', chords: '和弦', melody: '旋律' } as const;

export function RuleInspector({ issues, store }: { issues: CompositionIssue[]; store: StoreApi<StudioState> }) {
  return (
    <aside className="rule-inspector" aria-label="作品建议">
      <h2>听感检查</h2>
      {issues.length === 0 ? (
        <p className="rules-clear"><CheckCircle aria-hidden="true" weight="fill" /> 四条轨道已经彼此照应。</p>
      ) : (
        <ol>
          {issues.map((issue, index) => (
            <li key={`${issue.code}-${issue.track ?? 'all'}-${issue.beat ?? index}`}>
              <button
                disabled={!issue.track}
                onClick={() => issue.track && store.getState().focusAt(issue.track, issue.beat ?? 0)}
                type="button"
              >
                <Crosshair aria-hidden="true" />
                <span>{issue.message}</span>
                {issue.track && <small>{TRACK_LABELS[issue.track]} · 第 {(issue.beat ?? 0) + 1} 拍</small>}
              </button>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
