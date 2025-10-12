const db = require('../../db/database');

const mapSetting = (row) => {
  if (!row) {
    return null;
  }

  return {
    key: row.key,
    value: row.value,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

const SystemSetting = {
  get: (key) => {
    const stmt = db.prepare(
      `
        SELECT key, value, created_at, updated_at
        FROM system_settings
        WHERE key = ?
        LIMIT 1
      `
    );

    return mapSetting(stmt.get(key));
  },

  set: (key, value) => {
    const stmt = db.prepare(
      `
        INSERT INTO system_settings (key, value)
        VALUES (@key, @value)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = datetime('now')
      `
    );

    stmt.run({ key, value });

    return SystemSetting.get(key);
  }
};

module.exports = SystemSetting;
