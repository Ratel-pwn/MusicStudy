import { expect, expectNoHorizontalOverflow, resetApp, test } from './helpers';

test('新用户点击中央 C 并进入地图', async ({ page }) => {
  await resetApp(page);
  await page.getByRole('button', { name: '播放中央 C' }).click();
  await expect(page.getByRole('status', { name: '中央 C 的声音回应' })).toContainText('声音已经留下航标');
  expect(await page.evaluate(() => globalThis.__MUSICSTUDY_AUDIO_TEST_SPY__?.unlockCalls)).toBe(1);
  expect(await page.evaluate(() => globalThis.__MUSICSTUDY_AUDIO_TEST_SPY__?.playedMidi[0])).toBe(60);
  await page.getByRole('link', { name: '沿着声音出发' }).click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.getByRole('button', { name: /声音的高与低/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.goto('/');
});
