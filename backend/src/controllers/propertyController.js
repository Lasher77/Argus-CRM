// src/controllers/propertyController.js
const Property = require('../models/property');
const { ApiError } = require('../utils/apiError');

// Alle Hausobjekte abrufen
const getAllProperties = (req, res, next) => {
  try {
    const properties = Property.getAll();
    res.json({ success: true, data: properties });
  } catch (err) {
    next(ApiError.from(err));
  }
};

// Hausobjekt nach ID abrufen
const getPropertyById = (req, res, next) => {
  try {
    const property = Property.getById(req.params.id);
    if (property) {
      res.json({ success: true, data: property });
    } else {
      next(new ApiError(404, 'Hausobjekt nicht gefunden', { code: 'PROPERTY_NOT_FOUND' }));
    }
  } catch (err) {
    next(ApiError.from(err));
  }
};

// Hausobjekte nach Account-ID abrufen
const getPropertiesByAccountId = (req, res, next) => {
  try {
    const properties = Property.getByAccountId(req.params.accountId);
    res.json({ success: true, data: properties });
  } catch (err) {
    next(ApiError.from(err));
  }
};

// Neues Hausobjekt erstellen
const createProperty = (req, res, next) => {
  try {
    const newProperty = Property.create(req.body);
    res.status(201).json({ success: true, data: newProperty });
  } catch (err) {
    next(ApiError.from(err));
  }
};

// Hausobjekt aktualisieren
const updateProperty = (req, res, next) => {
  try {
    const updatedProperty = Property.update(req.params.id, req.body);
    res.json({ success: true, data: updatedProperty });
  } catch (err) {
    next(ApiError.from(err));
  }
};

// Hausobjekt löschen
const deleteProperty = (req, res, next) => {
  try {
    Property.delete(req.params.id);
    res.json({ success: true, message: 'Hausobjekt erfolgreich gelöscht' });
  } catch (err) {
    next(ApiError.from(err));
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
