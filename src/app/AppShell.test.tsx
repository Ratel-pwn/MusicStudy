import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';

function renderShell(route: string) {
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="*" element={<main>页面内容</main>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  it('keeps the home navigation focused on entering the archipelago', () => {
    renderShell('/');
    expect(screen.getByRole('navigation', { name: '首页导航' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '群岛' })).toHaveAttribute('href', '/map');
    expect(screen.queryByRole('link', { name: '练习' })).not.toBeInTheDocument();
  });

  it('reduces lesson navigation to exit and course context', () => {
    renderShell('/lesson/pitch-middle-c');
    const navigation = screen.getByRole('navigation', { name: '课程导航' });
    expect(navigation).toHaveTextContent('课程进行中');
    expect(screen.getByRole('link', { name: '退出课程' })).toHaveAttribute('href', '/map');
    expect(screen.queryByRole('link', { name: '练习' })).not.toBeInTheDocument();
  });

  it('leaves studio navigation to its transport and keeps one return action', () => {
    renderShell('/studio/studio-draft');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '返回群岛' })).toHaveAttribute('href', '/map');
    expect(screen.queryByRole('link', { name: '创作' })).not.toBeInTheDocument();
  });

  it('uses a chart-edge set of destinations on the map', () => {
    renderShell('/map');
    expect(screen.getByRole('navigation', { name: '群岛边缘导航' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '练习' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '能力' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '创作' })).not.toBeInTheDocument();
  });

  it('keeps every primary destination in the standard floating navigation', () => {
    renderShell('/practice');
    expect(screen.getByRole('link', { name: '群岛' })).toHaveAttribute('href', '/map');
    expect(screen.getByRole('link', { name: '练习' })).toHaveAttribute('href', '/practice');
    expect(screen.getByRole('link', { name: '创作' })).toHaveAttribute('href', '/studio/studio-draft');
    expect(screen.getByRole('link', { name: '能力' })).toHaveAttribute('href', '/progress');
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});
