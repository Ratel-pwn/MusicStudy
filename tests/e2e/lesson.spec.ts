import { completeHighLowLesson, continueGuidedStep, expect, resetApp, test } from './helpers';

test('完成课程并获得星级', async ({ page }) => {
  await resetApp(page, '/lesson/pitch-high-low');
  await completeHighLowLesson(page);
  await expect(page.getByRole('heading', { name: '课程完成' })).toBeVisible();
  await expect(page.getByText('100 分 · 3 星')).toBeVisible();
  await page.getByRole('button', { name: '退出课程' }).click();
  await expect(page.getByRole('button', { name: /声音的高与低.*3 星/ })).toBeVisible();
});

test('三次错误提示后完成变式题', async ({ page }) => {
  await resetApp(page, '/lesson/pitch-high-low');
  await page.getByRole('button', { name: '播放示范' }).click();
  await continueGuidedStep(page);
  await page.getByRole('button', { name: '我看清了' }).click();
  await continueGuidedStep(page);

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

test('八小节观察图在手机与宽屏上保持正确分组', async ({ page }) => {
  await resetApp(page, '/lesson/creation-eight-bars');
  await page.getByRole('button', { name: '播放示范' }).click();
  await continueGuidedStep(page);

  await expect(page.getByRole('img', { name: '前四小节建立后四小节回应的八小节结构' })).toBeVisible();
  const groups = page.getByTestId('eight-bar-section');
  await expect(groups).toHaveCount(2);
  const first = await groups.nth(0).boundingBox();
  const second = await groups.nth(1).boundingBox();
  expect(first).not.toBeNull();
  expect(second).not.toBeNull();
  if ((page.viewportSize()?.width ?? 0) < 640) expect(second!.y).toBeGreaterThan(first!.y);
  else expect(second!.x).toBeGreaterThan(first!.x);
});

test('取消或确认重新开始后仍可完整完成第一关', async ({ page }) => {
  await resetApp(page, '/lesson/pitch-high-low');
  await page.getByRole('button', { name: '播放示范' }).click();
  await continueGuidedStep(page);
  await expect(page.getByText('2 / 6')).toBeVisible();

  await page.getByRole('button', { name: '重新开始' }).click();
  await expect(page.getByRole('dialog', { name: '重新开始本关？' })).toBeVisible();
  await page.getByRole('button', { name: '继续学习' }).click();
  await expect(page.getByText('2 / 6')).toBeVisible();

  await page.getByRole('button', { name: '重新开始' }).click();
  await page.getByRole('button', { name: '确认重新开始' }).click();
  await expect(page.getByText('1 / 6')).toBeVisible();
  await expect(page.getByRole('button', { name: '播放示范' })).toBeVisible();

  await completeHighLowLesson(page);
  await expect(page.getByRole('heading', { name: '课程完成' })).toBeVisible();
  await expect(page.getByText('100 分 · 3 星')).toBeVisible();
});
