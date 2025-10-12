const { expect } = require('@playwright/test');

async function loginViaUi(page, username = 'admin', password = 'admin123') {
  await page.goto('/login');
  await page.getByLabel('Benutzername oder E-Mail').fill(username);
  await page.getByLabel('Passwort').fill(password);
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/api/auth/login') && response.status() < 400
    ),
    page.getByRole('button', { name: 'Anmelden' }).click(),
  ]);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: /WerkAssist/i })).toBeVisible();
}

module.exports = {
  loginViaUi,
};
