// db/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const resolveDatabasePath = () => {
  const customPath = process.env.TEST_DB_PATH || process.env.DB_PATH;

  if (customPath) {
    if (customPath === ':memory:') {
      return ':memory:';
    }

    const absolutePath = path.isAbsolute(customPath)
      ? customPath
      : path.join(__dirname, '../data', customPath);

    const dirName = path.dirname(absolutePath);
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }

    return absolutePath;
  }

  const dbDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, 'crm-argus.db');
};

const dbPath = resolveDatabasePath();
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

module.exports = db;
