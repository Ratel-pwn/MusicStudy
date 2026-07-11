import { expect, expectNoHorizontalOverflow, resetApp, test } from './helpers';

test('键盘操作与减少动效模式保持完整流程', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await resetApp(page, '/lesson/pitch-high-low');
  await page.getByRole('button', { name: '播放示范' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '继续课程' })).toBeEnabled();
  await page.getByRole('button', { name: '继续课程' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: /观察竖直音高轨迹/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
