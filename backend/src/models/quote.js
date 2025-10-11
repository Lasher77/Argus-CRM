// src/models/quote.js
const db = require('../../db/database');

const Quote = {
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM quotes');
    return stmt.all();
  },

  getById: (id) => {
    const stmt = db.prepare('SELECT * FROM quotes WHERE quote_id = ?');
    return stmt.get(id);
  },

  getByAccountId: (accountId) => {
    const stmt = db.prepare('SELECT * FROM quotes WHERE account_id = ?');
    return stmt.all(accountId);
  },

  create: (quote) => {
    const stmt = db.prepare(`
      INSERT INTO quotes (
        quote_number, quote_date, valid_until, 
        status, total_net, total_gross, notes, 
        account_id, property_id, contact_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      quote.quote_number,
      quote.quote_date,
      quote.valid_until,
      quote.status || 'created',
      quote.total_net,
      quote.total_gross,
      quote.notes,
      quote.account_id,
      quote.property_id, // Property ID is now required
      quote.contact_id || null // Contact ID is now optional
    );

    return { ...quote, quote_id: result.lastInsertRowid };
  },

  update: (id, quote) => {
    const stmt = db.prepare(`
      UPDATE quotes SET
        quote_number = ?,
        quote_date = ?,
        valid_until = ?,
        status = ?,
        total_net = ?,
        total_gross = ?,
        notes = ?,
        account_id = ?,
        property_id = ?,
        contact_id = ?
      WHERE quote_id = ?
    `);

    stmt.run(
      quote.quote_number,
      quote.quote_date,
      quote.valid_until,
      quote.status,
      quote.total_net,
      quote.total_gross,
      quote.notes,
      quote.account_id,
      quote.property_id, // Property ID is now required
      quote.contact_id || null, // Contact ID is now optional
      id
    );

    return { ...quote, quote_id: id };
  },

  delete: (id) => {
    const stmt = db.prepare('DELETE FROM quotes WHERE quote_id = ?');
    return stmt.run(id);
  },

  // Angebotspositionen
  getItems: (quoteId) => {
    const stmt = db.prepare('SELECT * FROM quote_items WHERE quote_id = ?');
    const items = stmt.all(quoteId);
    // Stelle sicher, dass immer ein Array zurückgegeben wird, auch wenn keine Items gefunden wurden
    return items || [];
  },

  addItem: (quoteId, item) => {
    const stmt = db.prepare(`
      INSERT INTO quote_items (
        quote_id, product_id, description, quantity, unit, 
        unit_price, vat_rate, total_net, total_gross, position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      quoteId,
      item.product_id || null,
      item.description,
      item.quantity,
      item.unit,
      item.unit_price,
      item.vat_rate,
      item.total_net,
      item.total_gross,
      item.position
    );

    return { ...item, quote_item_id: result.lastInsertRowid, quote_id: quoteId };
  },

  updateItem: (itemId, item) => {
    const stmt = db.prepare(`
      UPDATE quote_items SET
        product_id = ?,
        description = ?,
        quantity = ?,
        unit = ?,
        unit_price = ?,
        vat_rate = ?,
        total_net = ?,
        total_gross = ?,
        position = ?
      WHERE quote_item_id = ?
    `);

    stmt.run(
      item.product_id || null,
      item.description,
      item.quantity,
      item.unit,
      item.unit_price,
      item.vat_rate,
      item.total_net,
      item.total_gross,
      item.position,
      itemId
    );

    return { ...item, quote_item_id: itemId };
  },

  deleteItem: (itemId) => {
    const stmt = db.prepare('DELETE FROM quote_items WHERE quote_item_id = ?');
    return stmt.run(itemId);
  }
};

module.exports = Quote;
