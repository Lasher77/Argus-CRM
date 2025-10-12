const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { loginViaUi } = require('./utils/auth');

const baselinePath = path.join(__dirname, 'fixtures', 'dashboard.base64');
const baselineBuffer = Buffer.from(fs.readFileSync(baselinePath, 'utf-8'), 'base64');

test('Benutzer kann sich erfolgreich anmelden und Dashboard sehen', async ({ page }) => {
  await loginViaUi(page);

  await expect(page.getByRole('heading', { name: 'Willkommen bei WerkAssist' })).toBeVisible();

  const screenshot = await page.screenshot({ fullPage: true, animations: 'disabled' });

  expect.soft(screenshot.byteLength).toBeGreaterThan(0);
  expect(screenshot).toEqual(baselineBuffer);
});
