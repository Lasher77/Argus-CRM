// src/models/property.js
const db = require('../../db/database');

const Property = {
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM properties');
    return stmt.all();
  },
  
  getById: (id) => {
    const stmt = db.prepare('SELECT * FROM properties WHERE property_id = ?');
    return stmt.get(id);
  },
  
  getByAccountId: (accountId) => {
    const stmt = db.prepare('SELECT * FROM properties WHERE account_id = ?');
    return stmt.all(accountId);
  },
  
  create: (property) => {
    const stmt = db.prepare(`
      INSERT INTO properties (
        name, address, city, postal_code, country,
        account_id, contact_id, notes, alt_invoice_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      property.name,
      property.address,
      property.city,
      property.postal_code,
      property.country,
      property.account_id,
      property.contact_id,
      property.notes,
      property.alt_invoice_address
    );
    
    return { ...property, property_id: result.lastInsertRowid };
  },
  
  update: (id, property) => {
    const stmt = db.prepare(`
      UPDATE properties SET
        name = ?,
        address = ?,
        city = ?,
        postal_code = ?,
        country = ?,
        account_id = ?,
        contact_id = ?,
        notes = ?,
        alt_invoice_address = ?
      WHERE property_id = ?
    `);
    
    stmt.run(
      property.name,
      property.address,
      property.city,
      property.postal_code,
      property.country,
      property.account_id,
      property.contact_id,
      property.notes,
      property.alt_invoice_address,
      id
    );
    
    return { ...property, property_id: id };
  },
  
  delete: (id) => {
    const stmt = db.prepare('DELETE FROM properties WHERE property_id = ?');
    return stmt.run(id);
  }
};

module.exports = Property;
