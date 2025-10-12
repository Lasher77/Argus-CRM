const path = require('path');
const { defineConfig, devices } = require('@playwright/test');

const e2eDatabasePath = path.resolve(__dirname, '../backend/data/e2e-test.db');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 120000,
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retry-with-video',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run start:test',
      cwd: path.resolve(__dirname, '../backend'),
      env: {
        NODE_ENV: 'test',
        TEST_DB_PATH: e2eDatabasePath,
      },
      url: 'http://localhost:3000/',
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm start',
      cwd: __dirname,
      env: {
        PORT: '3001',
        BROWSER: 'none',
      },
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
  globalSetup: require.resolve('./tests/e2e/setup/globalSetup.js'),
});
