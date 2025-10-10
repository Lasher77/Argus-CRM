const express = require('express');
const router = express.Router();
const serviceOrderController = require('../controllers/serviceOrderController');

router.get('/service-orders', serviceOrderController.getServiceOrders);
router.get('/service-orders/:id', serviceOrderController.getServiceOrderById);
router.post('/service-orders', serviceOrderController.createServiceOrder);
router.put('/service-orders/:id', serviceOrderController.updateServiceOrder);
router.patch('/service-orders/:id/status', serviceOrderController.updateServiceOrderStatus);
router.delete('/service-orders/:id', serviceOrderController.deleteServiceOrder);

router.post('/service-orders/:id/time-entries', serviceOrderController.addTimeEntry);
router.put('/time-entries/:entryId', serviceOrderController.updateTimeEntry);
router.delete('/time-entries/:entryId', serviceOrderController.deleteTimeEntry);

router.post('/service-orders/:id/material-usage', serviceOrderController.addMaterialUsage);
router.put('/material-usage/:usageId', serviceOrderController.updateMaterialUsage);
router.delete('/material-usage/:usageId', serviceOrderController.deleteMaterialUsage);

router.post('/service-orders/:id/photos', serviceOrderController.addPhoto);
router.delete('/service-orders/:id/photos/:photoId', serviceOrderController.deletePhoto);

router.post('/service-orders/:id/signature', serviceOrderController.setSignature);
router.delete('/service-orders/:id/signature', serviceOrderController.clearSignature);

module.exports = router;
