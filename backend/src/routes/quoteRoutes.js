// src/routes/quoteRoutes.js
const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const { authorizeRoles } = require('../middleware/authMiddleware');

// Alle Angebote abrufen
router.get('/quotes', quoteController.getAllQuotes);

// Angebot nach ID abrufen
router.get('/quotes/:id', quoteController.getQuoteById);

// Angebote nach Account-ID abrufen
router.get('/accounts/:accountId/quotes', quoteController.getQuotesByAccountId);

// Neues Angebot erstellen
router.post('/quotes', authorizeRoles('ACCOUNTING', 'ADMIN'), quoteController.createQuote);

// Angebot aktualisieren
router.put('/quotes/:id', authorizeRoles('ACCOUNTING', 'ADMIN'), quoteController.updateQuote);

// Angebot löschen
router.delete('/quotes/:id', authorizeRoles('ACCOUNTING', 'ADMIN'), quoteController.deleteQuote);

// Angebotsposition hinzufügen
router.post('/quotes/:quoteId/items', authorizeRoles('ACCOUNTING', 'ADMIN'), quoteController.addQuoteItem);

// Angebotsposition aktualisieren
router.put('/quotes/items/:itemId', authorizeRoles('ACCOUNTING', 'ADMIN'), quoteController.updateQuoteItem);

// Angebotsposition löschen
router.delete('/quotes/items/:itemId', authorizeRoles('ACCOUNTING', 'ADMIN'), quoteController.deleteQuoteItem);

// Angebotspositionen nach Angebots-ID abrufen (NEUE ROUTE)
router.get('/quotes/:id/items', quoteController.getQuoteById);

module.exports = router;
