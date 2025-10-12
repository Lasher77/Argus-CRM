// src/models/contact.js
const db = require('../../db/database');

const Contact = {
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM contacts');
    return stmt.all();
  },

  search: (query, { accountId, limit = 10 } = {}) => {
    const trimmedQuery = typeof query === 'string' ? query.trim() : '';
    const sanitizedLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(Number(limit), 50)) : 10;

    let sql = `
      SELECT *
      FROM contacts
      WHERE 1 = 1
    `;
    const params = [];

    if (accountId) {
      sql += ' AND account_id = ?';
      params.push(accountId);
    }

    if (trimmedQuery) {
      sql += ` AND (
        LOWER(first_name || ' ' || last_name) LIKE '%' || LOWER(?) || '%'
        OR LOWER(last_name || ' ' || first_name) LIKE '%' || LOWER(?) || '%'
        OR LOWER(IFNULL(email, '')) LIKE '%' || LOWER(?) || '%'
        OR LOWER(IFNULL(phone, '')) LIKE '%' || LOWER(?) || '%'
      )`;
      params.push(trimmedQuery, trimmedQuery, trimmedQuery, trimmedQuery);
    }

    sql += ' ORDER BY last_name, first_name LIMIT ?';
    params.push(sanitizedLimit);

    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  getById: (id) => {
    const stmt = db.prepare('SELECT * FROM contacts WHERE contact_id = ?');
    return stmt.get(id);
  },

  getByAccountId: (accountId) => {
    const stmt = db.prepare('SELECT * FROM contacts WHERE account_id = ?');
    return stmt.all(accountId);
  },

  create: (contact) => {
    const stmt = db.prepare(`
      INSERT INTO contacts (
        first_name, last_name, position, email, phone, mobile, 
        address, birthday, is_primary_contact, account_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      contact.first_name,
      contact.last_name,
      contact.position,
      contact.email,
      contact.phone,
      contact.mobile,
      contact.address,
      contact.birthday,
      contact.is_primary_contact,
      contact.account_id,
      contact.notes
    );

    return { ...contact, contact_id: result.lastInsertRowid };
  },

  update: (id, contact) => {
    const stmt = db.prepare(`
      UPDATE contacts SET
        first_name = ?,
        last_name = ?,
        position = ?,
        email = ?,
        phone = ?,
        mobile = ?,
        address = ?,
        birthday = ?,
        is_primary_contact = ?,
        account_id = ?,
        notes = ?
      WHERE contact_id = ?
    `);

    stmt.run(
      contact.first_name,
      contact.last_name,
      contact.position,
      contact.email,
      contact.phone,
      contact.mobile,
      contact.address,
      contact.birthday,
      contact.is_primary_contact,
      contact.account_id,
      contact.notes,
      id
    );

    return { ...contact, contact_id: id };
  },

  delete: (id) => {
    const stmt = db.prepare('DELETE FROM contacts WHERE contact_id = ?');
    return stmt.run(id);
  }
};

module.exports = Contact;
