// src/controllers/pdfTemplateController.js
const PdfTemplate = require('../models/pdfTemplate');

const getAllTemplates = (req, res) => {
  try {
    const templates = PdfTemplate.getAll();
    res.json({ success: true, data: templates });
  } catch (err) {
    console.error('Fehler beim Abrufen der Templates:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Laden der Templates' });
  }
};

const getTemplateById = (req, res) => {
  try {
    const templateId = parseInt(req.params.id, 10);
    if (isNaN(templateId)) {
      return res.status(400).json({ success: false, message: 'Ungültige Template-ID' });
    }
    const template = PdfTemplate.getById(templateId);
    if (template) {
      res.json({ success: true, data: template });
    } else {
      res.status(404).json({ success: false, message: 'Template nicht gefunden' });
    }
  } catch (err) {
    console.error('Fehler beim Abrufen des Templates:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Laden des Templates' });
  }
};

const createTemplate = (req, res) => {
  try {
    const { name, layout_json } = req.body;
    if (!name || !layout_json) {
      return res.status(400).json({ success: false, message: 'Name und layout_json sind erforderlich' });
    }
    const newTemplate = PdfTemplate.create({ name, layout_json });
    res.status(201).json({ success: true, data: newTemplate });
  } catch (err) {
    console.error('Fehler beim Erstellen des Templates:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Erstellen des Templates' });
  }
};

const updateTemplate = (req, res) => {
  try {
    const templateId = parseInt(req.params.id, 10);
    if (isNaN(templateId)) {
      return res.status(400).json({ success: false, message: 'Ungültige Template-ID' });
    }
    const { name, layout_json } = req.body;
    if (!name || !layout_json) {
      return res.status(400).json({ success: false, message: 'Name und layout_json sind erforderlich' });
    }
    const updatedTemplate = PdfTemplate.update(templateId, { name, layout_json });
    res.json({ success: true, data: updatedTemplate });
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Templates:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Aktualisieren des Templates' });
  }
};

const deleteTemplate = (req, res) => {
  try {
    const templateId = parseInt(req.params.id, 10);
    if (isNaN(templateId)) {
      return res.status(400).json({ success: false, message: 'Ungültige Template-ID' });
    }
    PdfTemplate.delete(templateId);
    res.json({ success: true, message: 'Template erfolgreich gelöscht' });
  } catch (err) {
    console.error('Fehler beim Löschen des Templates:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Löschen des Templates' });
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
