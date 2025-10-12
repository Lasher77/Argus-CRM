// src/routes/propertyRoutes.js
const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { authorizeRoles } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createPropertySchema, updatePropertySchema } = require('../validation/schemas/propertySchemas');
const { idParamSchema, accountIdParamSchema } = require('../validation/schemas/commonSchemas');

// Alle Hausobjekte abrufen
router.get('/properties/search', propertyController.searchProperties);
router.get('/properties', propertyController.getAllProperties);

// Hausobjekt nach ID abrufen
router.get('/properties/:id', validate(idParamSchema, 'params'), propertyController.getPropertyById);

// Hausobjekte nach Account-ID abrufen
router.get(
  '/accounts/:accountId/properties',
  validate(accountIdParamSchema, 'params'),
  propertyController.getPropertiesByAccountId
);

// Neues Hausobjekt erstellen
router.post(
  '/properties',
  authorizeRoles('ADMIN'),
  validate(createPropertySchema),
  propertyController.createProperty
);

// Hausobjekt aktualisieren
router.put(
  '/properties/:id',
  authorizeRoles('ADMIN'),
  validate(idParamSchema, 'params'),
  validate(updatePropertySchema),
  propertyController.updateProperty
);

// Hausobjekt löschen
router.delete(
  '/properties/:id',
  authorizeRoles('ADMIN'),
  validate(idParamSchema, 'params'),
  propertyController.deleteProperty
);

module.exports = router;
