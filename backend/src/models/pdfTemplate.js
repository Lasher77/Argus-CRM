// src/models/pdfTemplate.js
const db = require('../../db/database');

const PdfTemplate = {
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM pdf_templates');
    return stmt.all();
  },

  getById: (id) => {
    const stmt = db.prepare('SELECT * FROM pdf_templates WHERE template_id = ?');
    return stmt.get(id);
  },

  create: (template) => {
    const stmt = db.prepare(`
      INSERT INTO pdf_templates (name, layout_json)
      VALUES (?, ?)
    `);
    const result = stmt.run(template.name, template.layout_json);
    return { ...template, template_id: result.lastInsertRowid };
  },

  update: (id, template) => {
    const stmt = db.prepare(`
      UPDATE pdf_templates SET
        name = ?,
        layout_json = ?,
        updated_at = datetime('now')
      WHERE template_id = ?
    `);
    stmt.run(template.name, template.layout_json, id);
    return { ...template, template_id: id };
  },

  delete: (id) => {
    const stmt = db.prepare('DELETE FROM pdf_templates WHERE template_id = ?');
    return stmt.run(id);
  }
};

module.exports = PdfTemplate;
