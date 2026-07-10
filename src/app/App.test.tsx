import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

function renderRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
}

describe('application routes', () => {
  it('connects the archipelago map route to the real map page', () => {
    renderRoute('/map');
    expect(screen.getByRole('navigation', { name: '音乐群岛学习地图' })).toBeInTheDocument();
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
});
