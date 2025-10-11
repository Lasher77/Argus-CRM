const Invoice = require('../models/invoice');
const emailClient = require('../utils/emailClient');

const extractPdfBuffer = (pdfData) => {
  if (!pdfData || typeof pdfData !== 'string') {
    return null;
  }

  const base64 = pdfData.startsWith('data:')
    ? pdfData.substring(pdfData.indexOf(',') + 1)
    : pdfData;

  try {
    return Buffer.from(base64, 'base64');
  } catch (error) {
    return null;
  }
};

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

exports.getInvoicesBatch = (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, message: 'IDs sind erforderlich' });
    }

    const invoices = Invoice.getByIds(ids);
    res.json({ success: true, data: invoices });
  } catch (error) {
    handleError(res, error, 'Fehler beim Abrufen der Rechnungen');
  }
};

exports.sendInvoice = async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const invoice = Invoice.getById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Rechnung nicht gefunden' });
    }

    const to = Array.isArray(req.body.to) ? req.body.to.filter(Boolean).join(',') : req.body.to;
    const recipient = to || invoice.contact_email || invoice.account_email;
    if (!recipient) {
      return res
        .status(400)
        .json({ success: false, message: 'Kein Empfänger für den Rechnungsversand definiert' });
    }

    const pdfBuffer = extractPdfBuffer(req.body.pdfData);
    if (!pdfBuffer) {
      return res
        .status(400)
        .json({ success: false, message: 'Ungültige oder fehlende PDF-Daten' });
    }

    const filename = req.body.filename || `Rechnung-${invoice.invoice_number || invoice.invoice_id}.pdf`;
    const subject =
      req.body.subject || `Rechnung ${invoice.invoice_number || `#${invoice.invoice_id}`}`;
    const text =
      req.body.message ||
      `Guten Tag,

anbei erhalten Sie die Rechnung ${invoice.invoice_number || `#${invoice.invoice_id}`} als PDF.

Mit freundlichen Grüßen
Ihr Serviceteam`;

    await emailClient.sendMail({
      to: recipient,
      subject,
      text,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, 'Rechnung konnte nicht gesendet werden');
  }
};
