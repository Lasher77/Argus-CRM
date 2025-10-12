const { test, expect } = require('@playwright/test');
const { loginViaUi } = require('./utils/auth');

test('Angebotsdetail kann als PDF exportiert werden', async ({ page }) => {
  await loginViaUi(page);

  await page.getByRole('link', { name: 'Angebote' }).click();
  await expect(page.getByRole('heading', { name: 'Angebote' })).toBeVisible();

  const firstQuoteRow = page.getByRole('row', { name: /ANG-2025-001/ }).first();
  await expect(firstQuoteRow).toBeVisible();
  await firstQuoteRow.locator('button').first().click();

  await expect(page).toHaveURL(/\/quotes\//);
  await expect(page.getByRole('heading', { name: /Angebot #ANG-2025-001/ })).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Als PDF' }).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/Angebot_ANG-2025-001/i);
  await download.delete();
});
