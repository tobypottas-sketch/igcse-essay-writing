import { test, expect } from '@playwright/test';

test('Essay Writing boots standalone without browser errors', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('http://127.0.0.1:4173/essay-app.html', { waitUntil: 'networkidle' });
  await expect(page.locator('h1')).toContainText('IGCSE 0511 Essay Writer Dashboard');
  await expect(page.locator('body')).toContainText('Essay Practice Tool');
  expect(pageErrors).toEqual([]);
});
