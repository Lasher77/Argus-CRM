const Invoice = require('../models/invoice');

const handleError = (res, error, message = 'Interner Serverfehler') => {
  console.error(message, error);
  res.status(500).json({ success: false, message });
};

exports.getInvoices = (req, res) => {
  try {
    const invoices = Invoice.getAll();
    res.json({ success: true, data: invoices });
  } catch (error) {
    handleError(res, error, 'Fehler beim Abrufen der Rechnungen');
  }
};

exports.getInvoiceById = (req, res) => {
  try {
    const invoice = Invoice.getById(Number(req.params.id));
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Rechnung nicht gefunden' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    handleError(res, error, 'Fehler beim Abrufen der Rechnung');
  }
};

exports.createInvoice = (req, res) => {
  try {
    const invoice = Invoice.create(req.body);
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    handleError(res, error, 'Fehler beim Anlegen der Rechnung');
  }
};

exports.createInvoiceFromQuote = (req, res) => {
  try {
    const invoice = Invoice.createFromQuote(Number(req.params.quoteId), req.body);
    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    handleError(res, error, 'Fehler beim Erzeugen der Rechnung aus dem Angebot');
  }
};

exports.updateInvoice = (req, res) => {
  try {
    const invoice = Invoice.update(Number(req.params.id), req.body);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Rechnung nicht gefunden' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    handleError(res, error, 'Fehler beim Aktualisieren der Rechnung');
  }
};

exports.updateInvoiceStatus = (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status ist erforderlich' });
    }

    const invoice = Invoice.updateStatus(Number(req.params.id), status);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Rechnung nicht gefunden' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    handleError(res, error, 'Fehler beim Aktualisieren des Rechnungsstatus');
  }
};

exports.deleteInvoice = (req, res) => {
  try {
    const deleted = Invoice.delete(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Rechnung nicht gefunden' });
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, 'Fehler beim Löschen der Rechnung');
  }
};
