const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

router.get('/invoices', invoiceController.getInvoices);
router.get('/invoices/:id', invoiceController.getInvoiceById);
router.post('/invoices', invoiceController.createInvoice);
router.put('/invoices/:id', invoiceController.updateInvoice);
router.patch('/invoices/:id/status', invoiceController.updateInvoiceStatus);
router.delete('/invoices/:id', invoiceController.deleteInvoice);

router.post('/quotes/:quoteId/invoices', invoiceController.createInvoiceFromQuote);

module.exports = router;
