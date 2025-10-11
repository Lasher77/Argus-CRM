// src/routes/propertyRoutes.js
const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { authorizeRoles } = require('../middleware/authMiddleware');

// Alle Hausobjekte abrufen
router.get('/properties', propertyController.getAllProperties);

// Hausobjekt nach ID abrufen
router.get('/properties/:id', propertyController.getPropertyById);

// Hausobjekte nach Account-ID abrufen
router.get('/accounts/:accountId/properties', propertyController.getPropertiesByAccountId);

// Neues Hausobjekt erstellen
router.post('/properties', authorizeRoles('ADMIN'), propertyController.createProperty);

// Hausobjekt aktualisieren
router.put('/properties/:id', authorizeRoles('ADMIN'), propertyController.updateProperty);

// Hausobjekt löschen
router.delete('/properties/:id', authorizeRoles('ADMIN'), propertyController.deleteProperty);

module.exports = router;
