import { expect, resetApp, test } from './helpers';

test('编辑四条轨道并在刷新后恢复八小节作品', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';
  const selectTrack = async (label: string) => {
    if (mobile) await page.getByRole('button', { name: `在移动端查看${label}轨` }).click();
  };
  const addPitchedNote = async (label: string, midi: number) => {
    const cell = page.getByRole('button', { name: label });
    const box = await cell.boundingBox();
    expect(box).not.toBeNull();
    await cell.click({ position: { x: box!.width / 2, y: box!.height * ((72 - midi) / 24) } });
  };
  await resetApp(page, '/studio/e2e-composition');
  await page.getByRole('button', { name: '底鼓 第 1 拍' }).click();
  await selectTrack('贝斯');
  await addPitchedNote('在第 2 拍添加贝斯音符', 55);
  await selectTrack('和弦');
  await page.getByRole('button', { name: 'F 和弦片段' }).click();
  await page.getByRole('button', { name: '第 1 小节和弦区' }).click();
  await selectTrack('旋律');
  await addPitchedNote('在第 3 拍添加旋律音符', 64);
  await page.getByRole('textbox', { name: '作品名称' }).fill('即时保存练习');
  await page.getByRole('textbox', { name: '作品名称' }).blur();
  await selectTrack('鼓');
  await expect(page.getByRole('button', { name: '底鼓 第 1 拍' })).toHaveAttribute('aria-pressed', 'true');
  await selectTrack('贝斯');
  await expect(page.getByRole('button', { name: /贝斯音符 G3，位于第 2 拍/ })).toBeVisible();
  await selectTrack('旋律');
  await expect(page.getByRole('button', { name: /旋律音符 E4，位于第 3 拍/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('textbox', { name: '作品名称' })).toHaveValue('即时保存练习');
  await selectTrack('鼓');
  await expect(page.getByRole('button', { name: '底鼓 第 1 拍' })).toHaveAttribute('aria-pressed', 'true');
  await selectTrack('贝斯');
  await expect(page.getByRole('button', { name: /贝斯音符 G3，位于第 2 拍/ })).toBeVisible();
  await selectTrack('和弦');
  await expect(page.getByRole('button', { name: '第 1 小节和弦区' })).toContainText('F');
  await selectTrack('旋律');
  await expect(page.getByRole('button', { name: /旋律音符 E4，位于第 3 拍/ })).toBeVisible();
  await page.getByRole('button', { name: '播放作品' }).click();
  await page.getByRole('link', { name: '返回群岛' }).click();
  expect(await page.evaluate(() => globalThis.__MUSICSTUDY_AUDIO_TEST_SPY__?.stopCalls)).toBeGreaterThan(0);
});
