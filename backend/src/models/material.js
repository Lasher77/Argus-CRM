const db = require('../../db/database');

const mapMaterial = (row) => {
  if (!row) {
    return null;
  }

  return {
    ...row,
    low_stock: row.stock <= row.reorder_level
  };
};

const Material = {
  getAll: () => {
    const stmt = db.prepare(`
      SELECT *
      FROM materials
      ORDER BY name
    `);

    return stmt.all().map(mapMaterial);
  },

  getLowStock: () => {
    const stmt = db.prepare(`
      SELECT *
      FROM materials
      WHERE stock <= reorder_level
      ORDER BY name
    `);

    return stmt.all().map(mapMaterial);
  },

  getById: (id) => {
    const stmt = db.prepare(`
      SELECT *
      FROM materials
      WHERE material_id = ?
    `);

    return mapMaterial(stmt.get(id));
  },

  create: (data) => {
    const stmt = db.prepare(`
      INSERT INTO materials (
        name,
        sku,
        unit,
        stock,
        reorder_level,
        supplier_name,
        supplier_article_number,
        supplier_price,
        notes
      )
      VALUES (
        @name,
        @sku,
        @unit,
        @stock,
        @reorder_level,
        @supplier_name,
        @supplier_article_number,
        @supplier_price,
        @notes
      )
    `);

    const payload = {
      name: data.name,
      sku: data.sku ?? null,
      unit: data.unit ?? 'Stk.',
      stock: data.stock ?? 0,
      reorder_level: data.reorder_level ?? 0,
      supplier_name: data.supplier_name ?? null,
      supplier_article_number: data.supplier_article_number ?? null,
      supplier_price: data.supplier_price ?? null,
      notes: data.notes ?? null
    };

    const result = stmt.run(payload);
    return Material.getById(result.lastInsertRowid);
  },

  update: (id, data) => {
    const stmt = db.prepare(`
      UPDATE materials
      SET name = @name,
          sku = @sku,
          unit = @unit,
          stock = @stock,
          reorder_level = @reorder_level,
          supplier_name = @supplier_name,
          supplier_article_number = @supplier_article_number,
          supplier_price = @supplier_price,
          notes = @notes,
          updated_at = datetime('now')
      WHERE material_id = @material_id
    `);

    const payload = {
      material_id: id,
      name: data.name,
      sku: data.sku ?? null,
      unit: data.unit ?? 'Stk.',
      stock: data.stock ?? 0,
      reorder_level: data.reorder_level ?? 0,
      supplier_name: data.supplier_name ?? null,
      supplier_article_number: data.supplier_article_number ?? null,
      supplier_price: data.supplier_price ?? null,
      notes: data.notes ?? null
    };

    const result = stmt.run(payload);
    if (!result.changes) {
      return null;
    }

    return Material.getById(id);
  },

  adjustStock: (id, delta) => {
    const stmt = db.prepare(`
      UPDATE materials
      SET stock = stock + @delta,
          updated_at = datetime('now')
      WHERE material_id = @material_id
    `);

    const result = stmt.run({ material_id: id, delta });
    if (!result.changes) {
      return null;
    }

    return Material.getById(id);
  },

  delete: (id) => {
    const stmt = db.prepare(`
      DELETE FROM materials
      WHERE material_id = ?
    `);

    const result = stmt.run(id);
    return result.changes > 0;
  }
};

module.exports = Material;
