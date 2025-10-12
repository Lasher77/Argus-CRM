// src/routes/accountRoutes.js
const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { authorizeRoles } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createAccountSchema, updateAccountSchema } = require('../validation/schemas/accountSchemas');
const { idParamSchema } = require('../validation/schemas/commonSchemas');

// Account Routen
router.get('/accounts/search', accountController.searchAccounts);
router.get('/accounts', accountController.getAllAccounts);
router.get('/accounts/:id', validate(idParamSchema, 'params'), accountController.getAccountById);
router.post('/accounts', authorizeRoles('ADMIN'), validate(createAccountSchema), accountController.createAccount);
router.put(
  '/accounts/:id',
  authorizeRoles('ADMIN'),
  validate(idParamSchema, 'params'),
  validate(updateAccountSchema),
  accountController.updateAccount
);
router.delete(
  '/accounts/:id',
  authorizeRoles('ADMIN'),
  validate(idParamSchema, 'params'),
  accountController.deleteAccount
);
router.get('/accounts/:id/contacts', validate(idParamSchema, 'params'), accountController.getAccountContacts);
router.get('/accounts/:id/properties', validate(idParamSchema, 'params'), accountController.getAccountProperties);

module.exports = router;
