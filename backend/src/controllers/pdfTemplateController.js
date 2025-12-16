// src/controllers/pdfTemplateController.js
const { ZodError } = require('zod');
const PdfTemplate = require('../models/pdfTemplate');
const {
  templatePayloadSchema,
  templateUpdateSchema,
  renderRequestSchema,
  previewTemplateSchema
} = require('../validation/schemas/templateSchemas');
const { placeholderCatalog } = require('../utils/templatePlaceholders');
const { buildMockData } = require('../utils/templateMockData');
const {
  resolveTemplateSections,
  buildInlineHtmlDocument,
  buildPdfPayload
} = require('../utils/templateRenderer');
const { renderHtmlToPdfBuffer } = require('../utils/pdfRenderer');

const formatTemplateResponse = (template) => {
  if (!template) {
    return null;
  }

  return {
    id: template.templateId,
    name: template.name,
    type: template.type,
    htmlContent: template.htmlContent,
    cssContent: template.cssContent,
    headerHtml: template.headerHtml,
    footerHtml: template.footerHtml,
    layout: template.layout,
    versionLabel: template.versionLabel,
    metadata: template.metadata,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt
  };
};

const handleZodError = (res, error) =>
  res.status(400).json({
    success: false,
    message: 'Ungültige Daten für das Template',
    errors: error.errors
  });

const handleUnknownError = (res, error, message) => {
  console.error(message, error);
  return res.status(500).json({ success: false, message });
};

const getAllTemplates = (req, res) => {
  try {
    const templates = PdfTemplate.getAll().map(formatTemplateResponse);
    res.json({ success: true, data: templates });
  } catch (error) {
    handleUnknownError(res, error, 'Fehler beim Laden der Templates');
  }
};

const getTemplateById = (req, res) => {
  try {
    const templateId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(templateId)) {
      return res.status(400).json({ success: false, message: 'Ungültige Template-ID' });
    }

    const template = PdfTemplate.getById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template nicht gefunden' });
    }

    return res.json({ success: true, data: formatTemplateResponse(template) });
  } catch (error) {
    return handleUnknownError(res, error, 'Fehler beim Laden des Templates');
  }
};

const createTemplate = (req, res) => {
  try {
    const payload = templatePayloadSchema.parse(req.body);
    const created = PdfTemplate.create(payload);
    res.status(201).json({ success: true, data: formatTemplateResponse(created) });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(res, error);
    }
    return handleUnknownError(res, error, 'Fehler beim Erstellen des Templates');
  }
};

const updateTemplate = (req, res) => {
  try {
    const templateId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(templateId)) {
      return res.status(400).json({ success: false, message: 'Ungültige Template-ID' });
    }

    const payload = templateUpdateSchema.parse(req.body);
    const updated = PdfTemplate.update(templateId, payload);
    res.json({ success: true, data: formatTemplateResponse(updated) });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(res, error);
    }
    return handleUnknownError(res, error, 'Fehler beim Aktualisieren des Templates');
  }
};

const deleteTemplate = (req, res) => {
  try {
    const templateId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(templateId)) {
      return res.status(400).json({ success: false, message: 'Ungültige Template-ID' });
    }

    PdfTemplate.delete(templateId);
    return res.json({ success: true, message: 'Template erfolgreich gelöscht' });
  } catch (error) {
    return handleUnknownError(res, error, 'Fehler beim Löschen des Templates');
  }
};

const duplicateTemplate = (req, res) => {
  try {
    const templateId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(templateId)) {
      return res.status(400).json({ success: false, message: 'Ungültige Template-ID' });
    }

    const original = PdfTemplate.getById(templateId);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Template nicht gefunden' });
    }

    const duplicate = PdfTemplate.create({
      ...original,
      name: `${original.name} (Kopie)`,
      versionLabel: original.versionLabel ? `${original.versionLabel}-copy` : null,
      metadata: {
        ...original.metadata,
        duplicatedFrom: original.templateId,
        duplicatedAt: new Date().toISOString()
      }
    });

    return res.status(201).json({ success: true, data: formatTemplateResponse(duplicate) });
  } catch (error) {
    return handleUnknownError(res, error, 'Template konnte nicht dupliziert werden');
  }
};

const getPlaceholderCatalog = (req, res) => {
  res.json({ success: true, data: placeholderCatalog });
};

const getMockData = (req, res) => {
  res.json({ success: true, data: buildMockData() });
};

const previewTemplate = (req, res) => {
  try {
    const { template, data } = previewTemplateSchema.parse(req.body);
    const sections = resolveTemplateSections(template, data);
    const html = buildInlineHtmlDocument(sections);
    res.json({ success: true, data: { html } });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(res, error);
    }
    if (error.message && error.message.includes('Parse error')) {
      return res.status(400).json({
        success: false,
        message: 'Template-Syntaxfehler: ' + error.message
      });
    }

    return handleUnknownError(res, error, 'Vorschau konnte nicht erzeugt werden');
  }
};

const renderTemplateToPdf = async (req, res) => {
  try {
    const templateId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(templateId)) {
      return res.status(400).json({ success: false, message: 'Ungültige Template-ID' });
    }

    const template = PdfTemplate.getById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template nicht gefunden' });
    }

    const { data } = renderRequestSchema.parse(req.body ?? {});
    const payload = buildPdfPayload(template, data);
    const pdfBuffer = await renderHtmlToPdfBuffer(payload.html, {
      headerTemplate: payload.header,
      footerTemplate: payload.footer
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="template-${templateId}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(res, error);
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        ...(error.details ? { details: error.details } : {})
      });
    }

    if (error.message && error.message.includes('Parse error')) {
      return res.status(400).json({
        success: false,
        message: 'Template-Syntaxfehler: ' + error.message
      });
    }

    return handleUnknownError(res, error, 'PDF konnte nicht generiert werden');
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  getPlaceholderCatalog,
  getMockData,
  previewTemplate,
  renderTemplateToPdf
};
