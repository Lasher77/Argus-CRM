// src/routes/accountRoutes.js
const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { authorizeRoles } = require('../middleware/authMiddleware');

// Account Routen
router.get('/accounts', accountController.getAllAccounts);
router.get('/accounts/:id', accountController.getAccountById);
router.post('/accounts', authorizeRoles('ADMIN'), accountController.createAccount);
router.put('/accounts/:id', authorizeRoles('ADMIN'), accountController.updateAccount);
router.delete('/accounts/:id', authorizeRoles('ADMIN'), accountController.deleteAccount);
router.get('/accounts/:id/contacts', accountController.getAccountContacts);
router.get('/accounts/:id/properties', accountController.getAccountProperties);

module.exports = router;
