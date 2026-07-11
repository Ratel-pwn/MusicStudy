import { expect, resetApp, test } from './helpers';

test('编辑四条轨道并在刷新后恢复八小节作品', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  const selectTrack = async (label: string) => {
    if (mobile) await page.getByRole('button', { name: `在移动端查看${label}轨` }).click();
  };
  await resetApp(page, '/studio/e2e-composition');
  await page.getByRole('button', { name: '底鼓 第 1 拍' }).click();
  await selectTrack('贝斯');
  await page.getByRole('button', { name: '在第 2 拍添加贝斯音符' }).click();
  await selectTrack('和弦');
  await page.getByRole('button', { name: 'F 和弦片段' }).click();
  await page.getByRole('button', { name: '第 1 小节和弦区' }).click();
  await selectTrack('旋律');
  await page.getByRole('button', { name: '在第 3 拍添加旋律音符' }).click();
  await selectTrack('鼓');
  await expect(page.getByRole('button', { name: '底鼓 第 1 拍' })).toHaveAttribute('aria-pressed', 'true');
  await selectTrack('贝斯');
  await expect(page.getByRole('button', { name: /贝斯音符 C3，位于第 2 拍/ })).toBeVisible();
  await selectTrack('旋律');
  await expect(page.getByRole('button', { name: /旋律音符 C4，位于第 3 拍/ })).toBeVisible();
  await page.waitForTimeout(650);
  await page.reload();
  await selectTrack('鼓');
  await expect(page.getByRole('button', { name: '底鼓 第 1 拍' })).toHaveAttribute('aria-pressed', 'true');
  await selectTrack('贝斯');
  await expect(page.getByRole('button', { name: /贝斯音符 C3，位于第 2 拍/ })).toBeVisible();
  await selectTrack('和弦');
  await expect(page.getByRole('button', { name: '第 1 小节和弦区' })).toContainText('F');
  await selectTrack('旋律');
  await expect(page.getByRole('button', { name: /旋律音符 C4，位于第 3 拍/ })).toBeVisible();
});
