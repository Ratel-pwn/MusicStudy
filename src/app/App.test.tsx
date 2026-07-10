import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { db } from '../data/db';
import { compositionRepository } from '../data/repositories';
import { clearLatestRecoverySnapshot } from '../shared/useAutosaveRecovery';
import { useProgressStore } from '../stores/useProgressStore';
import { App } from './App';
import { vi } from 'vitest';

function renderRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
}

describe('application routes', () => {
  beforeEach(() => {
    clearLatestRecoverySnapshot();
    useProgressStore.setState({
      hydrated: true,
      progress: { id: 'local', xp: 0, streak: 0, stars: {}, unlockedLessonIds: [] },
    });
  });

  it('routes repository rejection into the recoverable app boundary', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(compositionRepository, 'recent').mockRejectedValueOnce(new Error('IndexedDB read failed'));

    renderRoute('/');

    expect(await screen.findByRole('heading', { name: '你的学习进度仍在本机' })).toBeInTheDocument();
    const map = screen.getByRole('link', { name: '返回地图' });
    expect(map).toHaveAttribute('href', '/map');
  });

  it('connects the archipelago map route to the real map page', async () => {
    renderRoute('/map');
    expect(await screen.findByRole('navigation', { name: '音乐群岛学习地图' })).toBeInTheDocument();
  });

  it('connects the practice route to the real daily practice page', () => {
    renderRoute('/practice');
    expect(screen.getByRole('main', { name: '今日练习' })).toBeInTheDocument();
  });

  it('connects the progress route to the real skill orbit page', () => {
    renderRoute('/progress');
    expect(screen.getByRole('main', { name: '能力轨道' })).toBeInTheDocument();
  });

  it('connects a lesson id to the real lesson player', () => {
    renderRoute('/lesson/pitch-middle-c');
    expect(screen.getByRole('progressbar', { name: '课程进度' })).toBeInTheDocument();
  });

  it('connects a composition id to the real studio transport', () => {
    renderRoute('/studio/studio-draft');
    expect(screen.getByRole('button', { name: '播放作品' })).toBeInTheDocument();
  });

  it('keeps the first-listen home hidden until persisted progress has hydrated', async () => {
    await db.progress.put({ id: 'local', xp: 24, streak: 1, stars: { 'pitch-high-low': 1 }, unlockedLessonIds: [] });
    useProgressStore.setState({
      hydrated: false,
      progress: { id: 'local', xp: 0, streak: 0, stars: {}, unlockedLessonIds: [] },
    });

    renderRoute('/');

    expect(screen.getByRole('status', { name: '正在载入拾音岛' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('button', { name: '播放中央 C' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '从熟悉的声音接着走' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '播放中央 C' })).not.toBeInTheDocument();
  });
});
