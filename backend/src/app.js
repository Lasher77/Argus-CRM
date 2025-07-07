// src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Routen importieren
const accountRoutes = require('./routes/accountRoutes');
const contactRoutes = require('./routes/contactRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const quoteRoutes = require('./routes/quoteRoutes');

// Stellen Sie sicher, dass das Datenverzeichnis existiert
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Express App initialisieren
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// API-Routen
app.use('/api', accountRoutes);
app.use('/api', contactRoutes);
app.use('/api', propertyRoutes);
app.use('/api', quoteRoutes);

// Einfache Root-Route für API-Test
app.get('/', (req, res) => {
  res.json({
    message: 'Willkommen bei der CRM-Argus API',
    version: '1.0.0',
    endpoints: {
      accounts: '/api/accounts',
      contacts: '/api/contacts',
      properties: '/api/properties',
      quotes: '/api/quotes'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route nicht gefunden' });
});

// Globaler Error Handler
app.use((err, req, res, next) => {
  console.error('Unbehandelter Fehler:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Interner Serverfehler',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});

module.exports = app;
