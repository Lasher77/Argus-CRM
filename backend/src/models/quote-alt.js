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
        title, description, issue_date, valid_until, 
        status, total_amount, account_id, contact_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      quote.title,
      quote.description,
      quote.issue_date,
      quote.valid_until,
      quote.status,
      quote.total_amount,
      quote.account_id,
      quote.contact_id
    );
    
    return { ...quote, quote_id: result.lastInsertRowid };
  },
  
  update: (id, quote) => {
    const stmt = db.prepare(`
      UPDATE quotes SET
        title = ?,
        description = ?,
        issue_date = ?,
        valid_until = ?,
        status = ?,
        total_amount = ?,
        account_id = ?,
        contact_id = ?
      WHERE quote_id = ?
    `);
    
    stmt.run(
      quote.title,
      quote.description,
      quote.issue_date,
      quote.valid_until,
      quote.status,
      quote.total_amount,
      quote.account_id,
      quote.contact_id,
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
    return stmt.all(quoteId);
  },
  
  addItem: (quoteId, item) => {
    const stmt = db.prepare(`
      INSERT INTO quote_items (
        quote_id, description, quantity, unit_price, total_price
      ) VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      quoteId,
      item.description,
      item.quantity,
      item.unit_price,
      item.total_price
    );
    
    return { ...item, item_id: result.lastInsertRowid, quote_id: quoteId };
  },
  
  updateItem: (itemId, item) => {
    const stmt = db.prepare(`
      UPDATE quote_items SET
        description = ?,
        quantity = ?,
        unit_price = ?,
        total_price = ?
      WHERE item_id = ?
    `);
    
    stmt.run(
      item.description,
      item.quantity,
      item.unit_price,
      item.total_price,
      itemId
    );
    
    return { ...item, item_id: itemId };
  },
  
  deleteItem: (itemId) => {
    const stmt = db.prepare('DELETE FROM quote_items WHERE item_id = ?');
    return stmt.run(itemId);
  }
};

module.exports = Quote;
