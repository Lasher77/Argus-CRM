// src/routes/templateRoutes.js
const express = require('express');
const router = express.Router();
const templateController = require('../controllers/pdfTemplateController');

router.get('/templates', templateController.getAllTemplates);
router.get('/templates/:id', templateController.getTemplateById);
router.post('/templates', templateController.createTemplate);
router.put('/templates/:id', templateController.updateTemplate);
router.delete('/templates/:id', templateController.deleteTemplate);

module.exports = router;
