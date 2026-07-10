import { ArrowCounterClockwise, ArrowClockwise, Pause, Play } from '@phosphor-icons/react';
import { useStore } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';
import { STUDIO_BPMS, type StudioBpm, type StudioState } from '../studioStore';

const touchTargetStyle = { minHeight: '2.75rem', minWidth: '2.75rem' } as const;

type TransportBarProps = {
  store: StoreApi<StudioState>;
  playing: boolean;
  onPlay(): void;
  onStop(): void;
};

export function TransportBar({ store, playing, onPlay, onStop }: TransportBarProps) {
  const bpm = useStore(store, (state) => state.composition.bpm);
  const key = useStore(store, (state) => state.composition.key);
  const playheadBeat = useStore(store, (state) => state.playheadBeat);
  const canUndo = useStore(store, (state) => state.canUndo);
  const canRedo = useStore(store, (state) => state.canRedo);
  const setBpm = useStore(store, (state) => state.setBpm);
  const setKey = useStore(store, (state) => state.setKey);

  return (
    <header className="transport-bar">
      <div className="transport-main">
        <button aria-label="播放作品" className="transport-primary" onClick={onPlay} style={touchTargetStyle} type="button">
          <Play aria-hidden="true" weight="fill" /> {playing ? '重新播放' : '播放'}
        </button>
        <button aria-label="停止播放" onClick={onStop} style={touchTargetStyle} type="button"><Pause aria-hidden="true" /> 停止</button>
        <button aria-label="撤销" disabled={!canUndo} onClick={() => store.getState().undo()} style={touchTargetStyle} type="button"><ArrowCounterClockwise aria-hidden="true" /></button>
        <button aria-label="重做" disabled={!canRedo} onClick={() => store.getState().redo()} style={touchTargetStyle} type="button"><ArrowClockwise aria-hidden="true" /></button>
      </div>
      <label>速度
        <select aria-label="速度" onChange={(event) => setBpm(Number(event.target.value) as StudioBpm)} style={touchTargetStyle} value={bpm}>
          {STUDIO_BPMS.map((value) => <option key={value} value={value}>{value} BPM</option>)}
        </select>
      </label>
      <label>调性
        <select aria-label="调性" onChange={(event) => setKey(event.target.value as 'C-major' | 'A-minor')} style={touchTargetStyle} value={key}>
          <option value="C-major">C 大调</option>
          <option value="A-minor">A 小调</option>
        </select>
      </label>
      <label className="playhead-control">循环位置
        <input
          aria-label="循环位置"
          max="32"
          min="0"
          onChange={(event) => store.getState().setPlayhead(Number(event.target.value))}
          step="0.25"
          type="range"
          value={playheadBeat}
        />
        <output>{playheadBeat.toFixed(2)} 拍</output>
      </label>
    </header>
  );
}
