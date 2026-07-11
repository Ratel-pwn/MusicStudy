import { expect, test, type Page } from '@playwright/test';

export { expect, test };

const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
  });
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? []).toEqual([]);
});

async function installAudioSpy(page: Page) {
  await page.addInitScript(() => {
    globalThis.__MUSICSTUDY_AUDIO_TEST_SPY__ = { unlockCalls: 0, playedMidi: [], playedCompositions: 0, stopCalls: 0 };
  });
}

export async function resetApp(page: Page, path = '/') {
  await installAudioSpy(page);
  await page.goto(path);
}

export async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

export async function submitCorrect(page: Page) {
  await page.getByRole('button', { name: '提交答案' }).click();
  await expect(page.getByRole('dialog', { name: '回答正确' })).toBeVisible();
  await page.getByRole('button', { name: '继续' }).click();
}

export async function completeHighLowLesson(page: Page) {
  await page.getByRole('button', { name: '播放示范' }).click();
  await submitCorrect(page);
  await page.getByRole('button', { name: '我看清了' }).click();
  await submitCorrect(page);
  await page.getByRole('button', { name: 'C3' }).click();
  await page.getByRole('button', { name: 'C5' }).click();
  await submitCorrect(page);
  await page.getByRole('button', { name: '更高' }).click();
  await submitCorrect(page);
  for (const note of ['C4', 'C5', 'C3']) await page.getByRole('button', { name: note }).click();
  await submitCorrect(page);
  await page.getByRole('button', { name: '写入作品' }).click();
  await expect(page.getByRole('button', { name: '提交答案' })).toBeEnabled();
  await submitCorrect(page);
}
