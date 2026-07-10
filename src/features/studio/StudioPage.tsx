import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { Waveform } from '@phosphor-icons/react';
import gsap from 'gsap';
import type { Composition, TrackKind } from '../../domain/music/types';
import { evaluateComposition } from '../../domain/music/composition';
import { compositionRepository } from '../../data/repositories';
import { useAudio } from '../../audio/useAudio';
import { useAutosaveRecovery } from '../../shared/useAutosaveRecovery';
import { useReducedMotion } from '../../shared/useReducedMotion';
import { ChordLane } from './components/ChordLane';
import { DrumSequencer } from './components/DrumSequencer';
import { PianoRoll } from './components/PianoRoll';
import { RuleInspector } from './components/RuleInspector';
import { TransportBar } from './components/TransportBar';
import { createStudioStore } from './studioStore';
import './studio.css';

export const STUDIO_COMPOSITION_KEY = 'musicstudy.studio.compositionId';
export const STUDIO_TRACK_KEY = 'musicstudy.studio.selectedTrack';

const TRACKS: Array<{ kind: TrackKind; label: string; detail: string }> = [
  { kind: 'drums', label: '鼓', detail: '落下节拍的骨架' },
  { kind: 'bass', label: '贝斯', detail: '托住和声的重心' },
  { kind: 'chords', label: '和弦', detail: '铺开八小节的颜色' },
  { kind: 'melody', label: '旋律', detail: '写下可哼唱的线条' },
];

const DEFAULT_COMPOSITION: Composition = {
  id: 'studio-draft',
  title: '未命名的八小节',
  bpm: 90,
  key: 'C-major',
  bars: 8,
  tracks: { drums: [], bass: [], chords: [], melody: [] },
};

const isTrackKind = (value: string | null): value is TrackKind => TRACKS.some((track) => track.kind === value);

export function StudioPage({ compositionId }: { compositionId?: string } = {}) {
  const rootRef = useRef<HTMLElement>(null);
  const { engine, unlock } = useAudio();
  const reducedMotion = useReducedMotion();
  const [store] = useState(() => {
    const next = createStudioStore({ ...DEFAULT_COMPOSITION, id: compositionId ?? DEFAULT_COMPOSITION.id });
    const rememberedTrack = localStorage.getItem(STUDIO_TRACK_KEY);
    if (isTrackKind(rememberedTrack)) next.getState().setSelectedTrack(rememberedTrack);
    return next;
  });
  const composition = useStore(store, (state) => state.composition);
  const selectedTrack = useStore(store, (state) => state.selectedTrack);
  const focusedBeat = useStore(store, (state) => state.focusedBeat);
  const [hydrated, setHydrated] = useState(false);
  const [playing, setPlaying] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const context = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>('.track-row', root);
      if (reducedMotion) {
        gsap.set(rows, { opacity: 1, y: 0 });
        return;
      }
      gsap.fromTo(rows, { opacity: 0, y: 28 }, {
        opacity: 1,
        y: 0,
        duration: 0.58,
        stagger: 0.08,
        ease: 'power2.out',
      });
    }, root);
    return () => context.revert();
  }, [reducedMotion]);

  useEffect(() => {
    let active = true;
    const id = compositionId ?? localStorage.getItem(STUDIO_COMPOSITION_KEY);
    if (!id) {
      setHydrated(true);
      return () => { active = false; };
    }
    void compositionRepository.get(id).then((restored) => {
      if (!active) return;
      store.getState().replaceComposition(restored ?? { ...DEFAULT_COMPOSITION, id });
    }).finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, [compositionId, store]);

  const saveComposition = useCallback(async (next: Composition) => {
    const saved = await compositionRepository.save(next);
    localStorage.setItem(STUDIO_COMPOSITION_KEY, next.id);
    return saved;
  }, []);
  const autosave = useAutosaveRecovery({
    enabled: hydrated,
    fileName: `${composition.title || '临时作品'}.json`,
    save: saveComposition,
    value: composition,
  });

  useEffect(() => {
    localStorage.setItem(STUDIO_TRACK_KEY, selectedTrack);
  }, [selectedTrack]);

  const play = async () => {
    await unlock();
    if (engine.status !== 'ready') return;
    engine.playComposition(store.getState().composition);
    setPlaying(true);
  };
  const stop = () => {
    engine.stop();
    setPlaying(false);
  };

  return (
    <main className="studio-page" ref={rootRef}>
      <div className="studio-masthead">
        <div>
          <span className="studio-kicker"><Waveform aria-hidden="true" /> 八小节创作台</span>
          <input aria-label="作品名称" className="composition-title" readOnly value={composition.title} />
        </div>
        <p>从节拍开始，让四条轨道在同一条时间线上相遇。</p>
      </div>

      {autosave.error && (
        <aside className="storage-recovery-banner" role="alert">
          <span>作品暂未保存，临时版本仍保留在此设备的内存中。</span>
          <button type="button" onClick={autosave.downloadSnapshot}>下载临时作品 JSON</button>
          <button type="button" onClick={() => void autosave.retry()}>重试保存</button>
        </aside>
      )}

      <TransportBar onPlay={() => void play()} onStop={stop} playing={playing} store={store} />

      <nav aria-label="移动端轨道选择" className="mobile-track-switcher">
        {TRACKS.map((track) => (
          <button
            aria-label={`在移动端查看${track.label}轨`}
            aria-pressed={selectedTrack === track.kind}
            key={track.kind}
            onClick={() => store.getState().setSelectedTrack(track.kind)}
            type="button"
          >{track.label}</button>
        ))}
      </nav>

      <div className="studio-workspace">
        <section className="timeline-shell" aria-label="32 拍时间轴">
          <div className="timeline-ruler">
            <span className="ruler-corner">轨道 / 小节</span>
            <div>{Array.from({ length: 8 }, (_, bar) => <span key={bar}>0{bar + 1}</span>)}</div>
          </div>
          {TRACKS.map((track) => (
            <section
              className={`track-row track-row--${track.kind}`}
              data-active={selectedTrack === track.kind}
              key={track.kind}
            >
              <button className="track-head" onClick={() => store.getState().setSelectedTrack(track.kind)} type="button">
                <strong>{track.label}</strong><span>{track.detail}</span>
              </button>
              <div className="track-editor">
                {track.kind === 'drums' && <DrumSequencer store={store} />}
                {track.kind === 'bass' && <PianoRoll store={store} track="bass" />}
                {track.kind === 'chords' && <ChordLane store={store} />}
                {track.kind === 'melody' && <PianoRoll store={store} track="melody" />}
                {selectedTrack === track.kind && focusedBeat !== null && (
                  <output
                    aria-label="规则定位"
                    className="beat-focus"
                    style={{ left: `${(focusedBeat / 32) * 100}%` }}
                  >
                    <span>已定位：第 {focusedBeat + 1} 拍</span>
                  </output>
                )}
              </div>
            </section>
          ))}
        </section>
        <RuleInspector issues={evaluateComposition(composition)} store={store} />
      </div>
    </main>
  );
}
