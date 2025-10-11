const db = require('../../db/database');

const mapToken = (row) => {
  if (!row) {
    return null;
  }

  return {
    token_id: row.token_id,
    user_id: row.user_id,
    token: row.token,
    expires_at: row.expires_at,
    created_at: row.created_at,
    revoked_at: row.revoked_at
  };
};

const RefreshToken = {
  create: (userId, token, expiresAt) => {
    const stmt = db.prepare(`
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES (@user_id, @token, @expires_at)
    `);

    const payload = {
      user_id: userId,
      token,
      expires_at: expiresAt
    };

    const result = stmt.run(payload);
    return RefreshToken.findById(result.lastInsertRowid);
  },

  findByToken: (token) => {
    const stmt = db.prepare(`
      SELECT *
      FROM refresh_tokens
      WHERE token = ?
    `);

    return mapToken(stmt.get(token));
  },

  findById: (id) => {
    const stmt = db.prepare(`
      SELECT *
      FROM refresh_tokens
      WHERE token_id = ?
    `);

    return mapToken(stmt.get(id));
  },

  deleteByToken: (token) => {
    const stmt = db.prepare(`
      DELETE FROM refresh_tokens
      WHERE token = ?
    `);

    stmt.run(token);
  },

  deleteByUserId: (userId) => {
    const stmt = db.prepare(`
      DELETE FROM refresh_tokens
      WHERE user_id = ?
    `);

    stmt.run(userId);
  }
};

module.exports = RefreshToken;
