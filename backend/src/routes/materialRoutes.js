const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');

router.get('/materials', materialController.getMaterials);
router.get('/materials/low-stock', materialController.getLowStock);
router.get('/materials/:id', materialController.getMaterialById);
router.post('/materials', materialController.createMaterial);
router.put('/materials/:id', materialController.updateMaterial);
router.delete('/materials/:id', materialController.deleteMaterial);
router.post('/materials/:id/adjust', materialController.adjustStock);

module.exports = router;
