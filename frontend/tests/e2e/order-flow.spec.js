const { test, expect } = require('@playwright/test');
const { loginViaUi } = require('./utils/auth');

test.use({
  geolocation: { latitude: 52.5005, longitude: 13.4241 },
  permissions: ['geolocation'],
});

test('Mitarbeitende können einen Auftrag starten und stoppen', async ({ page }) => {
  const apiLoginResponse = await page.request.post('http://localhost:3000/api/auth/login', {
    data: { username: 'admin', password: 'admin123' },
  });
  const apiLoginJson = await apiLoginResponse.json();
  const token = apiLoginJson.data.accessToken;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const orderResponse = await page.request.get('http://localhost:3000/api/service-orders/1', {
    headers: authHeaders,
  });
  const orderJson = await orderResponse.json();
  const order = orderJson.data;
  const today = new Date().toISOString().slice(0, 10);

  const updatePayload = {
    title: order.title,
    description: order.description,
    account_id: order.account_id,
    property_id: order.property_id,
    service_recipient_contact_id: order.service_recipient_contact_id,
    invoice_account_id: order.invoice_account_id || order.account_id,
    status: 'planned',
    priority: order.priority || 'medium',
    planned_date: today,
    planned_start: `${today}T08:00:00`,
    planned_end: `${today}T11:00:00`,
    actual_start: null,
    actual_end: null,
    estimated_hours: order.estimated_hours,
    google_event_id: null,
    outlook_event_id: null,
    notes: order.notes,
  };

  await page.request.put('http://localhost:3000/api/service-orders/1', {
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    data: updatePayload,
  });

  if (Array.isArray(order.time_entries)) {
    for (const entry of order.time_entries) {
      if (!entry.end_time) {
        await page.request.put(`http://localhost:3000/api/time-entries/${entry.time_entry_id}`, {
          headers: { ...authHeaders, 'Content-Type': 'application/json' },
          data: {
            employee_id: entry.employee_id,
            start_time: entry.start_time,
            end_time: entry.end_time || new Date().toISOString(),
            notes: entry.notes || 'Reset durch Test',
          },
        });
      }
    }
  }

  await loginViaUi(page);

  await page.getByRole('link', { name: 'Arbeitszettel' }).click();
  await expect(page.getByRole('heading', { name: /Arbeitszettel/i })).toBeVisible();

  const orderCard = page.getByText('Türschließer Austausch Bürogebäude Kreuzberg').first();
  await expect(orderCard).toBeVisible();
  await orderCard.click();

  const checkInButton = page.getByRole('button', { name: 'Ich bin am Objekt' });
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/service-orders/1/check-in') && response.request().method() === 'POST'
    ),
    checkInButton.click(),
  ]);

  await expect(page.getByText(/Timer läuft seit/i)).toBeVisible({ timeout: 20000 });

  const stopButton = page.getByRole('button', { name: 'Timer stoppen' });
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes('/time-entries/') && response.request().method() === 'PUT'
    ),
    stopButton.click(),
  ]);

  await expect(page.getByText('Noch kein aktiver Timer.', { exact: true })).toBeVisible({ timeout: 20000 });
});
