// src/models/pdfTemplate.js
const db = require('../../db/database');

const defaultLayout = { canvas: { width: 595, height: 842 }, elements: [] };

const serializeTemplate = (template) => {
  const layout =
    typeof template.layout === 'string'
      ? template.layout
      : JSON.stringify(template.layout && Object.keys(template.layout).length ? template.layout : defaultLayout);

  let metadata;
  if (Object.prototype.hasOwnProperty.call(template, 'metadata')) {
    metadata = template.metadata == null ? null : JSON.stringify(template.metadata);
  } else {
    metadata = template.metadata_json ?? null;
  }

  return {
    name: template.name,
    type: template.type ?? 'invoice',
    html_content: template.htmlContent ?? template.html_content ?? '',
    css_content: template.cssContent ?? template.css_content ?? '',
    header_html: template.headerHtml ?? template.header_html ?? '',
    footer_html: template.footerHtml ?? template.footer_html ?? '',
    layout_json: layout,
    version_label: template.versionLabel ?? template.version_label ?? null,
    metadata_json: metadata
  };
};

const safeParse = (value, fallback) => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('Konnte JSON nicht parsen:', error);
    return fallback;
  }
};

const mapRowToTemplate = (row) => {
  if (!row) {
    return null;
  }

  return {
    templateId: row.template_id,
    name: row.name,
    type: row.type,
    htmlContent: row.html_content || '',
    cssContent: row.css_content || '',
    headerHtml: row.header_html || '',
    footerHtml: row.footer_html || '',
    layout: safeParse(row.layout_json, defaultLayout),
    versionLabel: row.version_label || null,
    metadata: safeParse(row.metadata_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const PdfTemplate = {
  getAll: () => {
    const stmt = db.prepare(`
      SELECT *
      FROM pdf_templates
      ORDER BY updated_at DESC
    `);
    return stmt.all().map(mapRowToTemplate);
  },

  getById: (id) => {
    const stmt = db.prepare('SELECT * FROM pdf_templates WHERE template_id = ?');
    const row = stmt.get(id);
    return mapRowToTemplate(row);
  },

  create: (template) => {
    const payload = serializeTemplate(template);
    const stmt = db.prepare(`
      INSERT INTO pdf_templates (
        name,
        type,
        html_content,
        css_content,
        header_html,
        footer_html,
        layout_json,
        version_label,
        metadata_json
      )
      VALUES (@name, @type, @html_content, @css_content, @header_html, @footer_html, @layout_json, @version_label, @metadata_json)
    `);
    const result = stmt.run(payload);
    return PdfTemplate.getById(result.lastInsertRowid);
  },

  update: (id, template) => {
    const payload = serializeTemplate(template);
    const stmt = db.prepare(`
      UPDATE pdf_templates SET
        name = @name,
        type = @type,
        html_content = @html_content,
        css_content = @css_content,
        header_html = @header_html,
        footer_html = @footer_html,
        layout_json = @layout_json,
        version_label = @version_label,
        metadata_json = @metadata_json,
        updated_at = datetime('now')
      WHERE template_id = @id
    `);
    stmt.run({ ...payload, id });
    return PdfTemplate.getById(id);
  },

  delete: (id) => {
    const stmt = db.prepare('DELETE FROM pdf_templates WHERE template_id = ?');
    return stmt.run(id);
  }
};

module.exports = PdfTemplate;
