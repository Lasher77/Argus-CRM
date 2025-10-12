const request = require('supertest');
const app = require('../src/app');

const authenticate = async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });

  return response.body.data.accessToken;
};

describe('Account CRUD API', () => {
  let token;

  beforeEach(async () => {
    token = await authenticate();
  });

  test('supports creating, reading, updating and deleting accounts', async () => {
    const listResponse = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.data)).toBe(true);

    const createPayload = {
      name: 'Test GmbH',
      address: 'Teststraße 1, 12345 Teststadt',
      phone: '+49 123 4567890',
      email: 'kontakt@test-gmbh.de',
      website: 'https://www.test-gmbh.de',
      tax_number: '123/456/789',
      notes: 'Automatisierter Test'
    };

    const createResponse = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send(createPayload);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    const newAccountId = createResponse.body.data.account_id;
    expect(newAccountId).toBeDefined();

    const getResponse = await request(app)
      .get(`/api/accounts/${newAccountId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.name).toBe(createPayload.name);

    const updatePayload = {
      ...createPayload,
      name: 'Test GmbH & Co. KG',
      notes: 'Aktualisiert im Test'
    };

    const updateResponse = await request(app)
      .put(`/api/accounts/${newAccountId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatePayload);

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.success).toBe(true);

    const updatedAccountResponse = await request(app)
      .get(`/api/accounts/${newAccountId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(updatedAccountResponse.status).toBe(200);
    expect(updatedAccountResponse.body.data.name).toBe(updatePayload.name);

    const deleteResponse = await request(app)
      .delete(`/api/accounts/${newAccountId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);

    const fetchAfterDelete = await request(app)
      .get(`/api/accounts/${newAccountId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(fetchAfterDelete.status).toBe(404);
  });
});
