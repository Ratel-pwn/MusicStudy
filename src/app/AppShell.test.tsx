import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { AppShell } from './AppShell';

const primaryDestinations = ['首页', '群岛', '练习', '创作', '能力'];

function renderShell(route: string) {
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="*" element={<main><Link to="/practice">切换到练习</Link></main>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  it.each(['/', '/map', '/practice', '/progress'])('keeps five stable destinations on %s', (route) => {
    renderShell(route);
    const navigation = screen.getByRole('navigation', { name: '拾音岛主导航' });
    for (const label of primaryDestinations) {
      expect(navigation).toContainElement(screen.getByRole('link', { name: label }));
    }
  });

  it('marks only the current primary destination active', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/practice']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="*" element={<main>页面内容</main>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(container.querySelectorAll('.shell-destinations .is-active')).toHaveLength(1);
    expect(screen.getByRole('link', { name: '练习' })).toHaveClass('is-active');
  });

  it('scrolls the next route to the top', async () => {
    const user = userEvent.setup();
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    renderShell('/map');
    expect(scrollTo).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('link', { name: '切换到练习' }));
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'auto' });
    scrollTo.mockRestore();
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

});
