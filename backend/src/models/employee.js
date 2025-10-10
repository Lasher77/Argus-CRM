const db = require('../../db/database');

const mapEmployee = (row) => {
  if (!row) {
    return null;
  }

  return {
    ...row,
    full_name: `${row.first_name} ${row.last_name}`.trim()
  };
};

const Employee = {
  getAll: () => {
    const stmt = db.prepare(`
      SELECT *
      FROM employees
      ORDER BY is_field_worker DESC, last_name, first_name
    `);

    return stmt.all().map(mapEmployee);
  },

  getById: (id) => {
    const stmt = db.prepare(`
      SELECT *
      FROM employees
      WHERE employee_id = ?
    `);

    return mapEmployee(stmt.get(id));
  },

  create: (data) => {
    const stmt = db.prepare(`
      INSERT INTO employees (
        first_name,
        last_name,
        email,
        phone,
        role,
        is_field_worker,
        color
      )
      VALUES (
        @first_name,
        @last_name,
        @email,
        @phone,
        @role,
        @is_field_worker,
        @color
      )
    `);

    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      role: data.role ?? 'field',
      is_field_worker: data.is_field_worker ? 1 : 0,
      color: data.color ?? null
    };

    const result = stmt.run(payload);
    return Employee.getById(result.lastInsertRowid);
  },

  update: (id, data) => {
    const stmt = db.prepare(`
      UPDATE employees
      SET first_name = @first_name,
          last_name = @last_name,
          email = @email,
          phone = @phone,
          role = @role,
          is_field_worker = @is_field_worker,
          color = @color,
          updated_at = datetime('now')
      WHERE employee_id = @employee_id
    `);

    const payload = {
      employee_id: id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      role: data.role ?? 'field',
      is_field_worker: data.is_field_worker ? 1 : 0,
      color: data.color ?? null
    };

    const result = stmt.run(payload);
    if (!result.changes) {
      return null;
    }

    return Employee.getById(id);
  },

  delete: (id) => {
    const stmt = db.prepare(`
      DELETE FROM employees
      WHERE employee_id = ?
    `);

    const result = stmt.run(id);
    return result.changes > 0;
  }
};

module.exports = Employee;
