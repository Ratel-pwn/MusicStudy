import { expect, resetApp, test } from './helpers';

test('普通页面共享稳定导航并区分当前项与悬停项', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', '桌面悬停状态只在指针设备验证');
  await resetApp(page, '/practice');
  const navigation = page.getByRole('navigation', { name: '拾音岛主导航' });
  for (const label of ['首页', '群岛', '练习', '创作', '能力']) {
    await expect(navigation.getByRole('link', { name: label, exact: true })).toBeVisible();
  }
  const active = navigation.getByRole('link', { name: '练习', exact: true });
  const hovered = navigation.getByRole('link', { name: '创作', exact: true });
  const activeBackground = await active.evaluate((element) => getComputedStyle(element).backgroundColor);
  await hovered.hover();
  await page.waitForTimeout(250);
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
