import { expect, expectNoHorizontalOverflow, resetApp, test } from './helpers';

test('1024×768 核心界面与减少动效验收', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet', '专用于 1024×768 Chromium 验收');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await resetApp(page);

  const heading = page.getByRole('heading', { level: 1 });
  const lines = await heading.evaluate((element) => {
    const style = getComputedStyle(element);
    const lineHeight = Number.parseFloat(style.lineHeight);
    return element.getBoundingClientRect().height / lineHeight;
  });
  expect(lines).toBeLessThanOrEqual(3.05);
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: '播放中央 C' }).click();
  await page.getByRole('link', { name: '沿着声音出发' }).click();
  const firstNode = page.getByRole('button', { name: /声音的高与低，已解锁/ });
  await expect(firstNode).toBeVisible();
  await firstNode.click();
  await expect(page.getByRole('button', { name: '播放示范' })).toBeVisible();
  await expect(page.getByText('聆听示范 · 无需选择')).toBeVisible();
  await page.getByRole('button', { name: '播放示范' }).click();
  await expect(page.getByRole('button', { name: '继续课程' })).toBeEnabled();
  await expectNoHorizontalOverflow(page);

  await page.goto('/studio/tablet-qa');
  const drum = page.getByRole('button', { name: '底鼓 第 1 拍' });
  await expect(drum).toBeVisible();
  await drum.click();
  await expect(drum).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'F 和弦片段' })).toBeVisible();
  await expect(page.getByRole('button', { name: '在第 1 拍添加旋律音符' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
