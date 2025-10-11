// src/routes/templateRoutes.js
const express = require('express');
const router = express.Router();
const templateController = require('../controllers/pdfTemplateController');
const { authorizeRoles } = require('../middleware/authMiddleware');

router.get('/templates', templateController.getAllTemplates);
router.get('/templates/:id', templateController.getTemplateById);
router.post('/templates', authorizeRoles('ADMIN'), templateController.createTemplate);
router.put('/templates/:id', authorizeRoles('ADMIN'), templateController.updateTemplate);
router.delete('/templates/:id', authorizeRoles('ADMIN'), templateController.deleteTemplate);

module.exports = router;
