import { HouseLine, MapTrifold, MusicNotes, PencilLine, Pulse } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

type NavigationMode = '首页入口' | '海图边缘' | '课程进度' | '创作运输' | '浮动分段';

function navigationMode(pathname: string): NavigationMode {
  if (pathname === '/') return '首页入口';
  if (pathname.startsWith('/map')) return '海图边缘';
  if (pathname.startsWith('/lesson/')) return '课程进度';
  if (pathname.startsWith('/studio/')) return '创作运输';
  return '浮动分段';
}

const destinations = [
  { to: '/', label: '首页', icon: HouseLine },
  { to: '/map', label: '群岛', icon: MapTrifold },
  { to: '/practice', label: '练习', icon: MusicNotes },
  { to: '/studio/studio-draft', label: '创作', icon: PencilLine },
  { to: '/progress', label: '能力', icon: Pulse },
] as const;

export function AppShell() {
  const { pathname } = useLocation();
  const mode = navigationMode(pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  if (mode === '课程进度') {
    return (
      <div className="app-shell" data-shell-mode={mode}>
        <nav aria-label="课程导航" className="shell-navigation shell-navigation--lesson">
          <Link to="/map">退出课程</Link>
          <strong>课程进行中</strong>
        </nav>
        <Outlet />
      </div>
    );
  }

  if (mode === '创作运输') {
    return (
      <div className="app-shell" data-shell-mode={mode}>
        <div className="shell-studio-return"><Link to="/map">返回群岛</Link></div>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="app-shell" data-shell-mode={mode}>
      <nav aria-label="拾音岛主导航" className="shell-navigation" data-navigation-mode={mode}>
        <NavLink aria-label="拾音岛首页" className="shell-mark" to="/">拾音岛</NavLink>
        <div className="shell-destinations">
          {destinations.map(({ to, label, icon: Icon }) => (
            <NavLink
              className={({ isActive }) => isActive ? 'is-active' : undefined}
              end={to === '/'}
              key={to}
              to={to}
            >
              <Icon aria-hidden="true" weight="duotone" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
