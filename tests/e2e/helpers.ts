import { expect, test, type Page } from '@playwright/test';
import { lessons } from '../../src/content/worlds';
import type { LessonStep } from '../../src/content/schema';
import { getAudioChoiceCandidates } from '../../src/features/lesson/audioChoice';

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
  await page.getByRole('button', { name: '继续', exact: true }).click();
}

export async function continueGuidedStep(page: Page) {
  const continueButton = page.getByRole('button', { name: '继续课程' });
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
}

function authoredChoices(step: LessonStep) {
  return Array.isArray(step.config.choices) ? step.config.choices : [];
}

export async function selectCorrectAuthoredChoice(page: Page, step: LessonStep) {
  const answer = step.config.answer;
  const candidates = getAudioChoiceCandidates(step);

  if (step.config.audioOptions !== undefined) {
    const group = page.getByRole('group', { name: '听辨候选' });
    const buttons = group.getByRole('button');
    for (const choice of authoredChoices(step)) {
      const escapedChoice = String(choice).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await expect(group.getByRole('button', { name: new RegExp(escapedChoice) })).toHaveCount(0);
    }
    await expect(buttons).toHaveCount(candidates.length);
    const correct = candidates.find(({ choice }) => Object.is(choice, answer));
    expect(correct, `Missing candidate for authored answer in ${step.id}`).toBeDefined();
    await group.getByRole('button', { name: `试听并选择候选 ${correct!.label}`, exact: true }).click();
    return;
  }

  await page.getByRole('button', { name: String(answer), exact: true }).click();
}

export async function selectCorrectVisibleAuthoredChoice(page: Page) {
  const focusTask = page.locator('.focus-task');
  for (const step of lessons.flatMap((lesson) => lesson.steps)) {
    if (step.type === 'choice' && await focusTask.getByText(step.prompt, { exact: true }).isVisible()) {
      await selectCorrectAuthoredChoice(page, step);
      return;
    }
  }
  throw new Error('No visible authored choice prompt matched the current practice item.');
}

export async function completeHighLowLesson(page: Page) {
  const lesson = lessons.find(({ id }) => id === 'pitch-high-low');
  const listeningChoice = lesson?.steps.find((step) => step.type === 'choice');
  expect(listeningChoice).toBeDefined();
  await page.getByRole('button', { name: '播放示范' }).click();
  await continueGuidedStep(page);
  await expect(page.getByRole('img', { name: '音高由低向高移动的竖直轨迹' })).toBeVisible();
  await page.getByRole('button', { name: '我看清了' }).click();
  await continueGuidedStep(page);
  await page.getByRole('button', { name: 'C3' }).click();
  await page.getByRole('button', { name: 'C5' }).click();
  await submitCorrect(page);
  await selectCorrectAuthoredChoice(page, listeningChoice!);
  await submitCorrect(page);
  for (const note of ['C4', 'C5', 'C3']) await page.getByRole('button', { name: note }).click();
  await submitCorrect(page);
  await page.getByRole('button', { name: '写入作品' }).click();
  await continueGuidedStep(page);
}
