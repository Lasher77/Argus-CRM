// src/controllers/propertyController.js
const Property = require('../models/property');

// Alle Hausobjekte abrufen
const getAllProperties = (req, res) => {
  try {
    const properties = Property.getAll();
    res.json({ success: true, data: properties });
  } catch (err) {
    console.error('Fehler beim Abrufen der Hausobjekte:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Laden der Hausobjekte' });
  }
};

// Hausobjekt nach ID abrufen
const getPropertyById = (req, res) => {
  try {
    const property = Property.getById(req.params.id);
    if (property) {
      res.json({ success: true, data: property });
    } else {
      res.status(404).json({ success: false, message: 'Hausobjekt nicht gefunden' });
    }
  } catch (err) {
    console.error('Fehler beim Abrufen des Hausobjekts:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Laden des Hausobjekts' });
  }
};

// Hausobjekte nach Account-ID abrufen
const getPropertiesByAccountId = (req, res) => {
  try {
    const properties = Property.getByAccountId(req.params.accountId);
    res.json({ success: true, data: properties });
  } catch (err) {
    console.error('Fehler beim Abrufen der Hausobjekte:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Laden der Hausobjekte' });
  }
};

// Neues Hausobjekt erstellen
const createProperty = (req, res) => {
  try {
    const newProperty = Property.create(req.body);
    res.status(201).json({ success: true, data: newProperty });
  } catch (err) {
    console.error('Fehler beim Erstellen des Hausobjekts:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Erstellen des Hausobjekts' });
  }
};

// Hausobjekt aktualisieren
const updateProperty = (req, res) => {
  try {
    const updatedProperty = Property.update(req.params.id, req.body);
    res.json({ success: true, data: updatedProperty });
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Hausobjekts:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Aktualisieren des Hausobjekts' });
  }
};

// Hausobjekt löschen
const deleteProperty = (req, res) => {
  try {
    Property.delete(req.params.id);
    res.json({ success: true, message: 'Hausobjekt erfolgreich gelöscht' });
  } catch (err) {
    console.error('Fehler beim Löschen des Hausobjekts:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Löschen des Hausobjekts' });
  }
};

module.exports = {
  getAllProperties,
  getPropertyById,
  getPropertiesByAccountId,
  createProperty,
  updateProperty,
  deleteProperty
};
