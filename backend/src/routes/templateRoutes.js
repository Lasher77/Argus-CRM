// src/routes/templateRoutes.js
const express = require('express');
const router = express.Router();
const templateController = require('../controllers/pdfTemplateController');
const templateAssetController = require('../controllers/templateAssetController');
const { authorizeRoles } = require('../middleware/authMiddleware');

const templateGuard = authorizeRoles(['ADMIN', 'ACCOUNTING']);

router.get('/templates', templateGuard, templateController.getAllTemplates);
router.get('/templates/placeholders', templateGuard, templateController.getPlaceholderCatalog);
router.get('/templates/mock-data', templateGuard, templateController.getMockData);
router.post('/templates/preview', templateGuard, templateController.previewTemplate);
router.get('/templates/:id', templateGuard, templateController.getTemplateById);
router.post('/templates', templateGuard, templateController.createTemplate);
router.put('/templates/:id', templateGuard, templateController.updateTemplate);
router.post('/templates/:id/duplicate', templateGuard, templateController.duplicateTemplate);
router.post('/templates/:id/render', templateGuard, templateController.renderTemplateToPdf);
router.delete('/templates/:id', templateGuard, templateController.deleteTemplate);

router.get('/template-assets', templateGuard, templateAssetController.listAssets);
router.post('/template-assets', templateGuard, templateAssetController.uploadAsset);

module.exports = router;
