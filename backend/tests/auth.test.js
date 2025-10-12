const request = require('supertest');
const app = require('../src/app');

const login = (credentials = { username: 'admin', password: 'admin123' }) =>
  request(app).post('/api/auth/login').send(credentials);

describe('Auth API', () => {
  test('allows a user to log in with valid credentials', async () => {
    const response = await login();

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({ username: 'admin', role: 'ADMIN' })
      })
    );
  });

  test('rejects invalid credentials', async () => {
    const response = await login({ username: 'admin', password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    const errorMessage = response.body.message ?? response.body.error?.message;
    expect(errorMessage).toContain('Ungültige Anmeldedaten');
  });

  test('can refresh access tokens using a valid refresh token', async () => {
    const loginResponse = await login();
    const refreshToken = loginResponse.body.data.refreshToken;

    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.success).toBe(true);
    expect(refreshResponse.body.data).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String)
      })
    );
  });
});
