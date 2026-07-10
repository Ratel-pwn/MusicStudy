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
  it.each([
    ['/map', '海图边缘'],
    ['/lesson/pitch-middle-c', '课程进度'],
    ['/studio/studio-draft', '创作运输'],
    ['/practice', '浮动分段'],
  ])('uses the %s navigation form for its musical space', (route, mode) => {
    renderShell(route);
    expect(screen.getByRole('navigation', { name: '拾音岛主导航' })).toHaveAttribute('data-navigation-mode', mode);
  });

  it('keeps every primary destination reachable without a fixed sidebar', () => {
    renderShell('/practice');
    expect(screen.getByRole('link', { name: '群岛' })).toHaveAttribute('href', '/map');
    expect(screen.getByRole('link', { name: '练习' })).toHaveAttribute('href', '/practice');
    expect(screen.getByRole('link', { name: '创作' })).toHaveAttribute('href', '/studio/studio-draft');
    expect(screen.getByRole('link', { name: '能力' })).toHaveAttribute('href', '/progress');
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});
