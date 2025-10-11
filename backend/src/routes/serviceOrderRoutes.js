const express = require('express');
const router = express.Router();
const serviceOrderController = require('../controllers/serviceOrderController');
const { authorizeRoles } = require('../middleware/authMiddleware');

router.get('/service-orders', serviceOrderController.getServiceOrders);
router.get('/service-orders/:id', serviceOrderController.getServiceOrderById);
router.post('/service-orders', authorizeRoles('ADMIN', 'WORKER'), serviceOrderController.createServiceOrder);
router.put('/service-orders/:id', authorizeRoles('ADMIN', 'WORKER'), serviceOrderController.updateServiceOrder);
router.patch('/service-orders/:id/status', authorizeRoles('ADMIN', 'WORKER'), serviceOrderController.updateServiceOrderStatus);
router.delete('/service-orders/:id', authorizeRoles('ADMIN', 'WORKER'), serviceOrderController.deleteServiceOrder);

router.post(
  '/service-orders/:id/check-in',
  authorizeRoles('ADMIN', 'WORKER'),
  serviceOrderController.checkIn
);

router.post('/service-orders/:id/time-entries', authorizeRoles('ADMIN', 'WORKER'), serviceOrderController.addTimeEntry);
router.put('/time-entries/:entryId', authorizeRoles('ADMIN', 'WORKER'), serviceOrderController.updateTimeEntry);
router.delete('/time-entries/:entryId', authorizeRoles('ADMIN', 'WORKER'), serviceOrderController.deleteTimeEntry);

router.post('/service-orders/:id/material-usage', authorizeRoles('ADMIN', 'WORKER'), serviceOrderController.addMaterialUsage);
router.put('/material-usage/:usageId', authorizeRoles('ADMIN', 'WORKER'), serviceOrderController.updateMaterialUsage);
router.delete('/material-usage/:usageId', authorizeRoles('ADMIN', 'WORKER'), serviceOrderController.deleteMaterialUsage);

router.post('/service-orders/:id/photos', authorizeRoles('ADMIN', 'WORKER'), serviceOrderController.addPhoto);
router.delete('/service-orders/:id/photos/:photoId', authorizeRoles('ADMIN', 'WORKER'), serviceOrderController.deletePhoto);

router.post('/service-orders/:id/signature', authorizeRoles('ADMIN', 'WORKER'), serviceOrderController.setSignature);
router.delete('/service-orders/:id/signature', authorizeRoles('ADMIN', 'WORKER'), serviceOrderController.clearSignature);

module.exports = router;
