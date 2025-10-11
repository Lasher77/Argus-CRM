const db = require('../../db/database');
const Quote = require('./quote');

const baseSelect = `
  SELECT
    i.*,
    a.name AS account_name,
    p.name AS property_name,
    c.first_name || ' ' || c.last_name AS contact_name
  FROM invoices i
  JOIN accounts a ON i.account_id = a.account_id
  LEFT JOIN properties p ON i.property_id = p.property_id
  LEFT JOIN contacts c ON i.contact_id = c.contact_id
`;

const invoiceItemSelect = db.prepare(`
  SELECT *
  FROM invoice_items
  WHERE invoice_id = ?
  ORDER BY position
`);

const hydrateInvoice = (row) => {
  if (!row) {
    return null;
  }

  const items = invoiceItemSelect.all(row.invoice_id);
  return {
    ...row,
    items
  };
};

const generateInvoiceNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 900) + 100;
  return `RE-${year}${month}${day}-${random}`;
};

const Invoice = {
  getAll: () => {
    const stmt = db.prepare(`${baseSelect} ORDER BY i.invoice_date DESC`);
    return stmt.all().map(hydrateInvoice);
  },

  getById: (id) => {
    const stmt = db.prepare(`${baseSelect} WHERE i.invoice_id = ?`);
    const row = stmt.get(id);
    return hydrateInvoice(row);
  },

  create: (data) => {
    const stmt = db.prepare(`
      INSERT INTO invoices (
        quote_id,
        account_id,
        property_id,
        contact_id,
        invoice_number,
        invoice_date,
        due_date,
        status,
        total_net,
        total_gross,
        amount_paid,
        payment_terms,
        notes
      )
      VALUES (
        @quote_id,
        @account_id,
        @property_id,
        @contact_id,
        @invoice_number,
        @invoice_date,
        @due_date,
        @status,
        @total_net,
        @total_gross,
        @amount_paid,
        @payment_terms,
        @notes
      )
    `);

    const payload = {
      quote_id: data.quote_id ?? null,
      account_id: data.account_id,
      property_id: data.property_id ?? null,
      contact_id: data.contact_id ?? null,
      invoice_number: data.invoice_number ?? generateInvoiceNumber(),
      invoice_date: data.invoice_date,
      due_date: data.due_date,
      status: data.status ?? 'created',
      total_net: data.total_net,
      total_gross: data.total_gross,
      amount_paid: data.amount_paid ?? 0,
      payment_terms: data.payment_terms ?? null,
      notes: data.notes ?? null
    };

    const result = stmt.run(payload);
    return Invoice.getById(result.lastInsertRowid);
  },

  createFromQuote: (quoteId, data = {}) => {
    const quote = Quote.getById(quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    const items = Quote.getItems(quoteId);
    const invoiceDate = data.invoice_date ?? new Date().toISOString().slice(0, 10);
    const dueDate =
      data.due_date ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const invoice = Invoice.create({
      quote_id: quote.quote_id,
      account_id: quote.account_id,
      property_id: quote.property_id ?? null,
      contact_id: quote.contact_id ?? null,
      invoice_number: data.invoice_number,
      invoice_date: invoiceDate,
      due_date: dueDate,
      status: 'created',
      total_net: quote.total_net,
      total_gross: quote.total_gross,
      payment_terms: data.payment_terms ?? 'Zahlbar innerhalb von 14 Tagen',
      notes: data.notes ?? quote.notes
    });

    const insertItem = db.prepare(`
      INSERT INTO invoice_items (
        invoice_id,
        quote_item_id,
        product_id,
        description,
        quantity,
        unit,
        unit_price,
        vat_rate,
        total_net,
        total_gross,
        position
      )
      VALUES (
        @invoice_id,
        @quote_item_id,
        @product_id,
        @description,
        @quantity,
        @unit,
        @unit_price,
        @vat_rate,
        @total_net,
        @total_gross,
        @position
      )
    `);

    items.forEach((item, index) => {
      insertItem.run({
        invoice_id: invoice.invoice_id,
        quote_item_id: item.quote_item_id,
        product_id: item.product_id ?? null,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        total_net: item.total_net,
        total_gross: item.total_gross,
        position: item.position ?? index + 1
      });
    });

    return Invoice.getById(invoice.invoice_id);
  },

  update: (id, data) => {
    const stmt = db.prepare(`
      UPDATE invoices
      SET invoice_date = @invoice_date,
          due_date = @due_date,
          status = @status,
          total_net = @total_net,
          total_gross = @total_gross,
          amount_paid = @amount_paid,
          payment_terms = @payment_terms,
          notes = @notes,
          updated_at = datetime('now')
      WHERE invoice_id = @invoice_id
    `);

    const result = stmt.run({
      invoice_id: id,
      invoice_date: data.invoice_date,
      due_date: data.due_date,
      status: data.status ?? 'created',
      total_net: data.total_net,
      total_gross: data.total_gross,
      amount_paid: data.amount_paid ?? 0,
      payment_terms: data.payment_terms ?? null,
      notes: data.notes ?? null
    });

    if (!result.changes) {
      return null;
    }

    return Invoice.getById(id);
  },

  updateStatus: (id, status) => {
    const stmt = db.prepare(`
      UPDATE invoices
      SET status = ?,
          updated_at = datetime('now')
      WHERE invoice_id = ?
    `);

    const result = stmt.run(status, id);
    if (!result.changes) {
      return null;
    }

    return Invoice.getById(id);
  },

  delete: (id) => {
    const stmt = db.prepare('DELETE FROM invoices WHERE invoice_id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

module.exports = Invoice;
