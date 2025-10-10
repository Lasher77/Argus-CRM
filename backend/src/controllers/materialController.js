const Material = require('../models/material');

const handleError = (res, error, message = 'Interner Serverfehler') => {
  console.error(message, error);
  res.status(500).json({ success: false, message });
};

exports.getMaterials = (req, res) => {
  try {
    const materials = Material.getAll();
    res.json({ success: true, data: materials });
  } catch (error) {
    handleError(res, error, 'Fehler beim Abrufen der Materialien');
  }
};

exports.getMaterialById = (req, res) => {
  try {
    const material = Material.getById(Number(req.params.id));
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material nicht gefunden' });
    }

    res.json({ success: true, data: material });
  } catch (error) {
    handleError(res, error, 'Fehler beim Abrufen des Materials');
  }
};

exports.createMaterial = (req, res) => {
  try {
    const material = Material.create(req.body);
    res.status(201).json({ success: true, data: material });
  } catch (error) {
    handleError(res, error, 'Fehler beim Anlegen des Materials');
  }
};

exports.updateMaterial = (req, res) => {
  try {
    const material = Material.update(Number(req.params.id), req.body);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material nicht gefunden' });
    }

    res.json({ success: true, data: material });
  } catch (error) {
    handleError(res, error, 'Fehler beim Aktualisieren des Materials');
  }
};

exports.deleteMaterial = (req, res) => {
  try {
    const deleted = Material.delete(Number(req.params.id));
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Material nicht gefunden' });
    }

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, 'Fehler beim Löschen des Materials');
  }
};

exports.adjustStock = (req, res) => {
  try {
    const { delta } = req.body;
    if (typeof delta !== 'number') {
      return res.status(400).json({ success: false, message: 'Delta muss eine Zahl sein' });
    }

    const material = Material.adjustStock(Number(req.params.id), delta);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material nicht gefunden' });
    }

    res.json({ success: true, data: material });
  } catch (error) {
    handleError(res, error, 'Fehler bei der Lagerbestandsanpassung');
  }
};

exports.getLowStock = (req, res) => {
  try {
    const materials = Material.getLowStock();
    res.json({ success: true, data: materials });
  } catch (error) {
    handleError(res, error, 'Fehler beim Abrufen der niedrigen Lagerbestände');
  }
};
