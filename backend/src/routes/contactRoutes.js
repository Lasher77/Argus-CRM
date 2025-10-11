// src/routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authorizeRoles } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createContactSchema, updateContactSchema } = require('../validation/schemas/contactSchemas');
const { idParamSchema, accountIdParamSchema } = require('../validation/schemas/commonSchemas');

// Alle Kontakte abrufen
router.get('/contacts', contactController.getAllContacts);

// Kontakt nach ID abrufen
router.get('/contacts/:id', validate(idParamSchema, 'params'), contactController.getContactById);

// Kontakte nach Account-ID abrufen
router.get(
  '/accounts/:accountId/contacts',
  validate(accountIdParamSchema, 'params'),
  contactController.getContactsByAccountId
);

// Neuen Kontakt erstellen
router.post('/contacts', authorizeRoles('ADMIN'), validate(createContactSchema), contactController.createContact);

// Kontakt aktualisieren
router.put(
  '/contacts/:id',
  authorizeRoles('ADMIN'),
  validate(idParamSchema, 'params'),
  validate(updateContactSchema),
  contactController.updateContact
);

// Kontakt löschen
router.delete(
  '/contacts/:id',
  authorizeRoles('ADMIN'),
  validate(idParamSchema, 'params'),
  contactController.deleteContact
);

module.exports = router;
