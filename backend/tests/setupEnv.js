const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.TEST_DB_PATH = process.env.TEST_DB_PATH || ':memory:';

const { seedTestData } = require('./utils/testData');

if (process.env.TEST_DB_PATH !== ':memory:') {
  const dbPath = path.isAbsolute(process.env.TEST_DB_PATH)
    ? process.env.TEST_DB_PATH
    : path.join(__dirname, '..', 'data', process.env.TEST_DB_PATH);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  process.env.TEST_DB_PATH = dbPath;
}

seedTestData();
