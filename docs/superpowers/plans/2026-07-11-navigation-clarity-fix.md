# Navigation Clarity Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一普通页面的五项主导航，区分当前、悬停和焦点状态，并消除路由滚动、地图高度和手机底部遮挡造成的混乱。

**Architecture:** `AppShell` 继续负责路由模式和导航信息架构，并在普通路由变化时执行窗口滚动复位。`globals.css` 负责主导航状态及桌面/手机安全区，`map.css` 让地图视口只占用导航之外的可视空间。Vitest 验证语义和路由行为，Playwright 验证真实浏览器中的几何关系与响应式表现。

**Tech Stack:** React 19、React Router 7、TypeScript、Vitest、Testing Library、Playwright、CSS、GSAP（保留现有地图动效）

## Global Constraints

- 普通页面的主目的地固定为：首页、群岛、练习、创作、能力。
- 课程页和创作工作室继续使用现有专注导航。
- 当前项使用日光黄色实心状态；悬停项不得复用该实心状态。
- 桌面和手机点击区域不得小于 44px × 44px。
- 路由滚动复位不得修改群岛地图内部拖动偏移。
- 遵循 `prefers-reduced-motion`，不增加无必要的依赖。
- 保持“音符群岛”视觉体系，避免标签、标题、描述反复堆叠的版式。
- 中文文案禁止使用用户指定的否定转折句式。

---

### Task 1: 统一导航语义并复位路由滚动

**Files:**
- Modify: `src/app/AppShell.test.tsx`
- Modify: `src/app/AppShell.tsx`

**Interfaces:**
- Consumes: React Router `useLocation()` 返回的 `pathname`。
- Produces: 普通页面统一的 `aria-label="拾音岛主导航"`、固定五项 `destinations`、每次 `pathname` 变化调用 `window.scrollTo({ top: 0, left: 0, behavior: 'auto' })`。

- [ ] **Step 1: 写出失败的导航与滚动测试**

将 `src/app/AppShell.test.tsx` 的普通导航断言改为以下行为，并保留课程页、工作室测试：

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { AppShell } from './AppShell';

const primaryDestinations = ['首页', '群岛', '练习', '创作', '能力'];

function renderShell(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route
            path="*"
            element={<main><Link to="/practice">切换到练习</Link></main>}
          />
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
    const { container } = renderShell('/practice');
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
});
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run: `npx vitest run src/app/AppShell.test.tsx`

Expected: FAIL；首页或群岛缺少部分目的地，且 `window.scrollTo` 未调用。

- [ ] **Step 3: 实现统一导航和滚动复位**

用以下完整实现替换 `src/app/AppShell.tsx`：

```tsx
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
```

- [ ] **Step 4: 运行单文件测试并确认通过**

Run: `npx vitest run src/app/AppShell.test.tsx`

Expected: PASS；所有 AppShell 用例通过。

- [ ] **Step 5: 提交导航行为**

```bash
git add src/app/AppShell.tsx src/app/AppShell.test.tsx
git commit -m "fix: unify primary navigation behavior"
```

---

### Task 2: 区分导航状态并修复桌面地图几何关系

**Files:**
- Create: `tests/e2e/navigation.spec.ts`
- Modify: `src/design/globals.css`
- Modify: `src/features/map/map.css`

**Interfaces:**
- Consumes: Task 1 产生的 `.shell-navigation`、`.shell-destinations`、`.is-active` 与 `data-shell-mode='海图边缘'`。
- Produces: 独立的 hover/focus/active 样式；桌面地图使用 `--map-shell-safe-top` 计算视口高度。

- [ ] **Step 1: 写出失败的桌面浏览器测试**

创建 `tests/e2e/navigation.spec.ts`：

```ts
import { expect, resetApp, test } from './helpers';

test('普通页面共享稳定导航并区分当前项与悬停项', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', '桌面悬停状态只在指针设备验证');
  await resetApp(page, '/practice');
  const navigation = page.getByRole('navigation', { name: '拾音岛主导航' });
  for (const label of ['首页', '群岛', '练习', '创作', '能力']) {
    await expect(navigation.getByRole('link', { name: label })).toBeVisible();
  }
  const active = navigation.getByRole('link', { name: '练习' });
  const hovered = navigation.getByRole('link', { name: '创作' });
  const activeBackground = await active.evaluate((element) => getComputedStyle(element).backgroundColor);
  await hovered.hover();
  const hoverBackground = await hovered.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(hoverBackground).not.toBe(activeBackground);
  await expect(active).toHaveClass(/is-active/);
});

test('群岛标题位于导航下方且页面没有地图产生的纵向滚动', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', '手机地图安全区在独立用例验证');
  await resetApp(page, '/map');
  const geometry = await page.evaluate(() => {
    const navigation = document.querySelector('.shell-navigation')!.getBoundingClientRect();
    const heading = document.querySelector('.map-heading')!.getBoundingClientRect();
    return {
      headingTop: heading.top,
      navigationBottom: navigation.bottom,
      scrollHeight: document.documentElement.scrollHeight,
      viewportHeight: innerHeight,
    };
  });
  expect(geometry.headingTop).toBeGreaterThanOrEqual(geometry.navigationBottom + 16);
  expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.viewportHeight);
});
```

- [ ] **Step 2: 运行桌面用例并确认按预期失败**

Run: `npm run test:e2e -- tests/e2e/navigation.spec.ts --project=desktop`

Expected: FAIL；hover 背景等于 active 背景，地图标题与导航重叠或页面高度超过视口。

- [ ] **Step 3: 实现导航状态和桌面地图安全区**

在 `src/design/globals.css` 中拆分状态并加入焦点环：

```css
.shell-destinations a {
  min-width: 3.5rem;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 0.75rem;
  color: rgba(255, 250, 240, 0.72);
  border: 1px solid transparent;
  border-radius: 0.8rem;
  text-decoration: none;
  transition: color var(--beat-fast), background var(--beat-fast), border-color var(--beat-fast), transform var(--beat-fast);
}

@media (hover: hover) and (pointer: fine) {
  .shell-destinations a:hover:not(.is-active) {
    color: var(--paper);
    border-color: rgba(255, 250, 240, 0.2);
    background: rgba(255, 250, 240, 0.08);
    transform: translateY(-1px);
  }
}

.shell-destinations a.is-active,
.shell-destinations a.is-active:hover {
  color: var(--sea-950);
  background: var(--sun-400);
  transform: translateY(-1px);
}

.shell-destinations a:focus-visible,
.shell-mark:focus-visible {
  outline: 2px solid var(--paper);
  outline-offset: 3px;
  box-shadow: 0 0 0 5px rgba(231, 197, 95, 0.38);
}

.app-shell[data-shell-mode='海图边缘'] > main {
  --map-shell-safe-top: calc(var(--shell-height) + 2.5rem);
  height: 100dvh;
  min-height: 42rem;
  padding-top: var(--map-shell-safe-top);
}
```

删除 `.shell-mode-note` 的样式规则。在 `src/features/map/map.css` 中让地图视口和浮层使用同一个安全区：

```css
.map-heading,
.map-legend {
  top: calc(var(--map-shell-safe-top) + clamp(1rem, 2vw, 2rem));
}

.archipelago-viewport {
  height: calc(100dvh - var(--map-shell-safe-top));
  min-height: calc(42rem - var(--map-shell-safe-top));
}
```

保留 `.map-heading` 的 left、z-index、max-width 与 pointer-events，保留 `.map-legend` 的 right、布局和视觉属性。

- [ ] **Step 4: 运行桌面浏览器测试并确认通过**

Run: `npm run test:e2e -- tests/e2e/navigation.spec.ts --project=desktop`

Expected: PASS；两个桌面导航用例通过。

- [ ] **Step 5: 提交桌面视觉修复**

```bash
git add tests/e2e/navigation.spec.ts src/design/globals.css src/features/map/map.css
git commit -m "fix: clarify desktop navigation states"
```

---

### Task 3: 修复手机底部导航安全空间

**Files:**
- Modify: `tests/e2e/navigation.spec.ts`
- Modify: `src/design/globals.css`
- Modify: `src/features/map/map.css`

**Interfaces:**
- Consumes: Task 2 的五项导航和地图安全区变量。
- Produces: `--mobile-shell-safe-bottom`，供普通页面底部 padding 与手机地图高度共同使用。

- [ ] **Step 1: 写出失败的手机浏览器测试**

追加到 `tests/e2e/navigation.spec.ts`：

```ts
test('手机底部导航保留五个点击目标和操作安全空间', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', '该几何关系只在手机项目验证');
  await resetApp(page, '/practice');
  const geometry = await page.evaluate(() => {
    const navigation = document.querySelector('.shell-navigation')!.getBoundingClientRect();
    const main = document.querySelector('main')!;
    const links = Array.from(document.querySelectorAll('.shell-destinations a'));
    return {
      navigationHeight: navigation.height,
      mainPaddingBottom: Number.parseFloat(getComputedStyle(main).paddingBottom),
      linkCount: links.length,
      smallestWidth: Math.min(...links.map((link) => link.getBoundingClientRect().width)),
      smallestHeight: Math.min(...links.map((link) => link.getBoundingClientRect().height)),
    };
  });
  expect(geometry.linkCount).toBe(5);
  expect(geometry.smallestWidth).toBeGreaterThanOrEqual(44);
  expect(geometry.smallestHeight).toBeGreaterThanOrEqual(44);
  expect(geometry.mainPaddingBottom).toBeGreaterThanOrEqual(geometry.navigationHeight + 24);
});

test('手机群岛地图不落入底部导航下方', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', '该几何关系只在手机项目验证');
  await resetApp(page, '/map');
  const geometry = await page.evaluate(() => {
    const navigation = document.querySelector('.shell-navigation')!.getBoundingClientRect();
    const viewport = document.querySelector('.archipelago-viewport')!.getBoundingClientRect();
    const legend = document.querySelector('.map-legend')!.getBoundingClientRect();
    return { navigationTop: navigation.top, viewportBottom: viewport.bottom, legendBottom: legend.bottom };
  });
  expect(geometry.viewportBottom).toBeLessThanOrEqual(geometry.navigationTop);
  expect(geometry.legendBottom).toBeLessThanOrEqual(geometry.navigationTop - 8);
});
```

- [ ] **Step 2: 运行手机用例并确认按预期失败**

Run: `npm run test:e2e -- tests/e2e/navigation.spec.ts --project=mobile`

Expected: FAIL；普通页面底部缓冲不足，地图视口或图例进入导航覆盖区。

- [ ] **Step 3: 实现手机安全区**

在 `src/design/globals.css` 的 `@media (max-width: 768px)` 中加入统一变量和覆盖：

```css
.app-shell {
  --mobile-shell-safe-bottom: calc(7rem + env(safe-area-inset-bottom));
}

.app-shell > main,
.app-shell[data-shell-mode='创作运输'] > main {
  padding-top: 0;
  padding-bottom: var(--mobile-shell-safe-bottom);
}

.app-shell[data-shell-mode='海图边缘'] > main {
  --map-shell-safe-top: 0px;
  height: 100dvh;
  min-height: 0;
  padding: 0 0 var(--mobile-shell-safe-bottom);
}
```

在 `src/features/map/map.css` 的手机媒体查询中加入：

```css
.map-heading { top: 1rem; }
.map-legend {
  top: auto;
  right: 1rem;
  bottom: calc(var(--mobile-shell-safe-bottom) + 0.5rem);
  left: 1rem;
  justify-content: space-around;
}
.archipelago-viewport {
  height: calc(100dvh - var(--mobile-shell-safe-bottom));
  min-height: 0;
}
```

- [ ] **Step 4: 运行手机浏览器测试并确认通过**

Run: `npm run test:e2e -- tests/e2e/navigation.spec.ts --project=mobile`

Expected: PASS；两个手机导航用例通过。

- [ ] **Step 5: 提交手机布局修复**

```bash
git add tests/e2e/navigation.spec.ts src/design/globals.css src/features/map/map.css
git commit -m "fix: reserve mobile navigation safe space"
```

---

### Task 4: 完整验证与 Chrome 验收

**Files:**
- Verify: `src/app/AppShell.tsx`
- Verify: `src/design/globals.css`
- Verify: `src/features/map/map.css`
- Verify: `tests/e2e/navigation.spec.ts`

**Interfaces:**
- Consumes: Tasks 1–3 的全部实现。
- Produces: 可交付的主分支验证证据与桌面/手机 Chrome 验收结果。

- [ ] **Step 1: 运行静态与文案检查**

Run: `npm run lint:copy`

Expected: `Copy check passed.`

Run: `npm run typecheck`

Expected: exit code 0。

Run: `git diff --check`

Expected: 无输出，exit code 0。

- [ ] **Step 2: 运行完整单元测试**

Run: `npm test`

Expected: 32 个以上测试文件全部通过，新增 AppShell 用例包含在通过结果中。

- [ ] **Step 3: 运行完整浏览器测试**

Run: `npm run test:e2e`

Expected: desktop、tablet、mobile 项目全部通过；只允许测试文件中显式的条件跳过。

- [ ] **Step 4: 运行生产构建**

Run: `npm run build`

Expected: TypeScript 与 Vite 构建成功；现有 bundle size 警告可记录为非阻塞项。

- [ ] **Step 5: 在用户 Chrome 中验收**

依次验证 `http://localhost:5173/`、`/map`、`/practice`、`/progress`：

- 普通页面始终显示五个主目的地。
- 当前项只有一个黄色实心状态。
- 鼠标经过其他项目时不会出现第二个黄色实心状态。
- 从滚动位置切换页面后，新页面标题完整显示。
- 390 × 844 视口中底部导航不覆盖提交按钮或地图图例。

- [ ] **Step 6: 最终工作区检查**

Run: `git status --short --branch`

Expected: `## main` 且没有未提交文件。
