const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { authorizeRoles } = require('../middleware/authMiddleware');

router.get('/materials', materialController.getMaterials);
router.get('/materials/low-stock', materialController.getLowStock);
router.get('/materials/:id', materialController.getMaterialById);
router.post('/materials', authorizeRoles('ACCOUNTING', 'ADMIN'), materialController.createMaterial);
router.put('/materials/:id', authorizeRoles('ACCOUNTING', 'ADMIN'), materialController.updateMaterial);
router.delete('/materials/:id', authorizeRoles('ACCOUNTING', 'ADMIN'), materialController.deleteMaterial);
router.post('/materials/:id/adjust', authorizeRoles('ACCOUNTING', 'ADMIN'), materialController.adjustStock);

module.exports = router;
