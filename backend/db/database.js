// db/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Stellen Sie sicher, dass das Datenbankverzeichnis existiert
const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Datenbankverbindung herstellen
const dbPath = path.join(dbDir, 'crm-argus.db');
const db = new Database(dbPath);

// Aktivieren Sie die Fremdschlüsselunterstützung
db.pragma('foreign_keys = ON');

module.exports = db;
