import { expect, expectNoHorizontalOverflow, resetApp, test } from './helpers';

test('键盘操作与减少动效模式保持完整流程', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await resetApp(page, '/lesson/pitch-high-low');
  await page.getByRole('button', { name: '播放示范' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '提交答案' })).toBeEnabled();
  await page.getByRole('button', { name: '提交答案' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: '回答正确' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
