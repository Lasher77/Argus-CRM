const path = require('path');

process.env.NODE_ENV = 'test';
process.env.TEST_DB_PATH = process.env.TEST_DB_PATH || ':memory:';

const dbPath = process.env.TEST_DB_PATH;

const { seedTestData } = require('./utils/testData');
const fs = require('fs');

const removeFileIfExists = (filePath) => {
  if (filePath && filePath !== ':memory:' && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

beforeEach(() => {
  seedTestData();
});

afterAll(() => {
  const finalPath = process.env.TEST_DB_PATH;
  if (finalPath && finalPath !== ':memory:' && fs.existsSync(finalPath)) {
    fs.unlinkSync(finalPath);
  }
});
