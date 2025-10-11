// src/routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authorizeRoles } = require('../middleware/authMiddleware');

// Alle Kontakte abrufen
router.get('/contacts', contactController.getAllContacts);

// Kontakt nach ID abrufen
router.get('/contacts/:id', contactController.getContactById);

// Kontakte nach Account-ID abrufen
router.get('/accounts/:accountId/contacts', contactController.getContactsByAccountId);

// Neuen Kontakt erstellen
router.post('/contacts', authorizeRoles('ADMIN'), contactController.createContact);

// Kontakt aktualisieren
router.put('/contacts/:id', authorizeRoles('ADMIN'), contactController.updateContact);

// Kontakt löschen
router.delete('/contacts/:id', authorizeRoles('ADMIN'), contactController.deleteContact);

module.exports = router;
