const path = require('path');

module.exports = async () => {
  const backendDir = path.resolve(__dirname, '../../../../backend');
  const dbPath = path.resolve(backendDir, 'data/e2e-test.db');

  process.env.PLAYWRIGHT_TEST_DB_PATH = dbPath;
};
