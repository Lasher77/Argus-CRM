const request = require('supertest');
const app = require('../src/app');

const authenticate = async (username = 'admin', password = 'admin123') => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username, password });

  return response.body.data.accessToken;
};

describe('Service order check-in', () => {
  let token;

  beforeEach(async () => {
    token = await authenticate();
  });

  test('allows check-in within allowed radius', async () => {
    const response = await request(app)
      .post('/api/service-orders/1/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employee_id: 1,
        latitude: 52.5005,
        longitude: 13.4241
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.distanceMeters).toBeLessThanOrEqual(50);
    expect(response.body.data).toBeDefined();
  });

  test('rejects check-in attempts far from the property', async () => {
    const response = await request(app)
      .post('/api/service-orders/1/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employee_id: 1,
        latitude: 0,
        longitude: 0
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Check-in nur innerhalb');
  });
});
