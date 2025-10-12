// src/models/account.js
const db = require('../../db/database');

// Account Model
const Account = {
  // Alle Accounts abrufen
  getAll: () => {
    const stmt = db.prepare(`
      SELECT * FROM accounts
      ORDER BY name
    `);
    return stmt.all();
  },

  search: (query, limit = 10) => {
    const trimmedQuery = typeof query === 'string' ? query.trim() : '';
    const sanitizedLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(Number(limit), 50)) : 10;

    if (!trimmedQuery) {
      const stmt = db.prepare(`
        SELECT *
        FROM accounts
        ORDER BY name
        LIMIT ?
      `);
      return stmt.all(sanitizedLimit);
    }

    const stmt = db.prepare(`
      SELECT *
      FROM accounts
      WHERE (
        LOWER(name) LIKE '%' || LOWER(?) || '%'
        OR LOWER(IFNULL(email, '')) LIKE '%' || LOWER(?) || '%'
        OR LOWER(IFNULL(address, '')) LIKE '%' || LOWER(?) || '%'
      )
      ORDER BY name
      LIMIT ?
    `);

    return stmt.all(trimmedQuery, trimmedQuery, trimmedQuery, sanitizedLimit);
  },

  // Account nach ID abrufen
  getById: (id) => {
    const stmt = db.prepare(`
      SELECT * FROM accounts
      WHERE account_id = ?
    `);
    return stmt.get(id);
  },

  // Neuen Account erstellen
  create: (accountData) => {
    const stmt = db.prepare(`
      INSERT INTO accounts (name, address, phone, email, website, tax_number, notes)
      VALUES (@name, @address, @phone, @email, @website, @tax_number, @notes)
    `);
    const result = stmt.run(accountData);
    return result.lastInsertRowid;
  },

  // Account aktualisieren
  update: (id, accountData) => {
    const stmt = db.prepare(`
      UPDATE accounts
      SET name = @name,
          address = @address,
          phone = @phone,
          email = @email,
          website = @website,
          tax_number = @tax_number,
          notes = @notes,
          updated_at = datetime('now')
      WHERE account_id = @account_id
    `);

    const params = { ...accountData, account_id: id };
    const result = stmt.run(params);
    return result.changes > 0;
  },

  // Account löschen
  delete: (id) => {
    const stmt = db.prepare(`
      DELETE FROM accounts
      WHERE account_id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  },

  // Kontakte eines Accounts abrufen
  getContacts: (accountId) => {
    const stmt = db.prepare(`
      SELECT * FROM contacts
      WHERE account_id = ?
      ORDER BY last_name, first_name
    `);
    return stmt.all(accountId);
  },

  // Hausobjekte eines Accounts abrufen
  getProperties: (accountId) => {
    const stmt = db.prepare(`
      SELECT * FROM properties
      WHERE account_id = ?
      ORDER BY name
    `);
    return stmt.all(accountId);
  }
};

module.exports = Account;
