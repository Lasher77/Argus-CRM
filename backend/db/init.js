// db/init.js
const { createTables, dropTables } = require('./schema');
const fs = require('fs');
const path = require('path');

// Stellen Sie sicher, dass das Datenverzeichnis existiert
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialisiere die Datenbank
function initDatabase(reset = false) {
  try {
    if (reset) {
      console.log('Lösche bestehende Tabellen...');
      dropTables();
    }
    
    console.log('Erstelle Datenbankschema...');
    createTables();
    
    console.log('Datenbank wurde erfolgreich initialisiert!');
  } catch (error) {
    console.error('Fehler bei der Datenbankinitialisierung:', error);
    process.exit(1);
  }
}

// Wenn das Skript direkt ausgeführt wird
if (require.main === module) {
  const args = process.argv.slice(2);
  const reset = args.includes('--reset');
  
  initDatabase(reset);
}

module.exports = initDatabase;
