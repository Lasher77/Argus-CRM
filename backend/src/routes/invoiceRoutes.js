const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authorizeRoles } = require('../middleware/authMiddleware');

router.get('/invoices', invoiceController.getInvoices);
router.get('/invoices/:id', invoiceController.getInvoiceById);
router.post('/invoices/batch', invoiceController.getInvoicesBatch);
router.post('/invoices', authorizeRoles('ACCOUNTING', 'ADMIN'), invoiceController.createInvoice);
router.put('/invoices/:id', authorizeRoles('ACCOUNTING', 'ADMIN'), invoiceController.updateInvoice);
router.patch('/invoices/:id/status', authorizeRoles('ACCOUNTING', 'ADMIN'), invoiceController.updateInvoiceStatus);
router.delete('/invoices/:id', authorizeRoles('ACCOUNTING', 'ADMIN'), invoiceController.deleteInvoice);
router.post(
  '/invoices/:id/send',
  authorizeRoles('ACCOUNTING', 'ADMIN'),
  invoiceController.sendInvoice
);

router.post('/quotes/:quoteId/invoices', authorizeRoles('ACCOUNTING', 'ADMIN'), invoiceController.createInvoiceFromQuote);

module.exports = router;
