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
