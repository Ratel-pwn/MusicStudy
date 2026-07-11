import { expect, resetApp, test } from './helpers';

test('完成六项今日练习并更新复习日期', async ({ page }) => {
  await resetApp(page);
  const startedAt = Date.now();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('music-study');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const skills = ['pitch', 'rhythm', 'pulse', 'keyboard', 'scale', 'chord'];
    const transaction = db.transaction('attempts', 'readwrite');
    skills.forEach((skillId, index) => transaction.objectStore('attempts').put({
      id: `e2e-${skillId}`,
      lessonId: `e2e-${index}`,
      skillIds: [skillId],
      correct: false,
      hints: 0,
      errorCode: 'e2e',
      createdAt: new Date(Date.now() + index).toISOString(),
    }));
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  });
  const baseline = await page.evaluate(async () => {
    const request = indexedDB.open('music-study');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = db.transaction('reviews', 'readonly');
    const countRequest = transaction.objectStore('reviews').count();
    const count = await new Promise<number>((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });
    db.close();
    return count;
  });
  expect(baseline).toBe(0);
  await page.goto('/practice');
  await expect(page.getByText('0 / 6 已完成')).toBeVisible();
  for (let index = 0; index < 6; index += 1) await page.getByRole('button', { name: '独立完成' }).click();
  await expect(page.getByRole('heading', { name: '今天的练习航道已走完' })).toBeVisible();
  const persisted = await page.evaluate(async () => {
    const request = indexedDB.open('music-study');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = db.transaction('reviews', 'readonly');
    const allRequest = transaction.objectStore('reviews').getAll();
    const records = await new Promise<Array<{ skillId: string; mastery: number; dueAt: string }>>((resolve, reject) => {
      allRequest.onsuccess = () => resolve(allRequest.result);
      allRequest.onerror = () => reject(allRequest.error);
    });
    db.close();
    return records.sort((a, b) => b.dueAt.localeCompare(a.dueAt))[0];
  });
  expect(persisted.mastery).toBe(12);
  expect(new Date(persisted.dueAt).getTime()).toBeGreaterThan(startedAt);
  const dueLabel = await page.evaluate((dueAt) => new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(dueAt)), persisted.dueAt);
  await expect(page.getByText(`下次复习：${dueLabel}`)).toBeVisible();

  await page.reload();
  const restored = await page.evaluate(async (skillId) => {
    const request = indexedDB.open('music-study');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = db.transaction('reviews', 'readonly');
    const getRequest = transaction.objectStore('reviews').get(skillId);
    const record = await new Promise<{ skillId: string; mastery: number; dueAt: string }>((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    db.close();
    return record;
  }, persisted.skillId);
  expect(restored).toEqual(persisted);
});
