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
const templateRoutes = require('./routes/templateRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const serviceOrderRoutes = require('./routes/serviceOrderRoutes');
const materialRoutes = require('./routes/materialRoutes');
const reportRoutes = require('./routes/reportRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');

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
app.use('/api', templateRoutes);
app.use('/api', employeeRoutes);
app.use('/api', serviceOrderRoutes);
app.use('/api', materialRoutes);
app.use('/api', reportRoutes);
app.use('/api', invoiceRoutes);

// Einfache Root-Route für API-Test
app.get('/', (req, res) => {
  res.json({
    message: 'Willkommen bei der WerkAssist API',
    version: '1.0.0',
    endpoints: {
      accounts: '/api/accounts',
      contacts: '/api/contacts',
      properties: '/api/properties',
      quotes: '/api/quotes',
      templates: '/api/templates',
      employees: '/api/employees',
      service_orders: '/api/service-orders',
      materials: '/api/materials',
      reports: '/api/reports',
      invoices: '/api/invoices'
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
