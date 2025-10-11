const db = require('../../db/database');

const mapUser = (row) => {
  if (!row) {
    return null;
  }

  return {
    user_id: row.user_id,
    username: row.username,
    email: row.email,
    password_hash: row.password_hash,
    first_name: row.first_name,
    last_name: row.last_name,
    role: row.role,
    is_active: row.is_active === 1 || row.is_active === true,
    last_login: row.last_login,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

const User = {
  findByUsernameOrEmail: (identifier) => {
    const stmt = db.prepare(`
      SELECT *
      FROM users
      WHERE lower(username) = lower(@identifier)
         OR lower(email) = lower(@identifier)
      LIMIT 1
    `);

    return mapUser(stmt.get({ identifier }));
  },

  findById: (id) => {
    const stmt = db.prepare(`
      SELECT *
      FROM users
      WHERE user_id = ?
    `);

    return mapUser(stmt.get(id));
  },

  updateLastLogin: (id) => {
    const stmt = db.prepare(`
      UPDATE users
      SET last_login = datetime('now'),
          updated_at = datetime('now')
      WHERE user_id = ?
    `);

    stmt.run(id);
  }
};

module.exports = User;
