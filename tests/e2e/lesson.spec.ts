import { completeHighLowLesson, expect, resetApp, test } from './helpers';

test('完成课程并获得星级', async ({ page }) => {
  await resetApp(page, '/lesson/pitch-high-low');
  await completeHighLowLesson(page);
  await expect(page.getByRole('heading', { name: '课程完成' })).toBeVisible();
  await expect(page.getByText('100 分 · 2 星')).toBeVisible();
  await page.getByRole('button', { name: '退出课程' }).click();
  await expect(page.getByRole('button', { name: /声音的高与低.*2 星/ })).toBeVisible();
});

test('三次错误提示后完成变式题', async ({ page }) => {
  await resetApp(page, '/lesson/pitch-high-low');
  await page.getByRole('button', { name: '播放示范' }).click();
  await page.getByRole('button', { name: '提交答案' }).click();
  await page.getByRole('button', { name: '继续' }).click();
  await page.getByRole('button', { name: '我看清了' }).click();
  await page.getByRole('button', { name: '提交答案' }).click();
  await page.getByRole('button', { name: '继续' }).click();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByRole('button', { name: 'C4' }).click();
    await page.getByRole('button', { name: '提交答案' }).click();
    await expect(page.getByRole('dialog', { name: `需要调整，反馈级别 ${attempt + 1}` })).toBeVisible();
    await page.getByRole('button', { name: '再试一次' }).click();
  }
  await expect(page.getByText('需要一个变式')).toBeVisible();
  for (const note of ['C5', 'C3']) await page.getByRole('button', { name: note }).click();
  await page.getByRole('button', { name: '提交答案' }).click();
  await expect(page.getByRole('dialog', { name: '回答正确' })).toBeVisible();
});
