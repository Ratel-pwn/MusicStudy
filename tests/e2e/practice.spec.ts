import { expect, resetApp, test } from './helpers';

test('完成六项今日练习并更新复习日期', async ({ page }) => {
  await resetApp(page);
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
  await page.goto('/practice');
  await expect(page.getByText('0 / 6 已完成')).toBeVisible();
  for (let index = 0; index < 6; index += 1) await page.getByRole('button', { name: '独立完成' }).click();
  await expect(page.getByRole('heading', { name: '今天的练习航道已走完' })).toBeVisible();
  await expect(page.getByText(/下次复习：/)).toBeVisible();
});
