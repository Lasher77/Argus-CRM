// src/controllers/contactController.js
const Contact = require('../models/contact');
const { ApiError } = require('../utils/apiError');

// Alle Kontakte abrufen
const getAllContacts = (req, res, next) => {
  try {
    const contacts = Contact.getAll();
    res.json({ success: true, data: contacts });
  } catch (err) {
    next(ApiError.from(err));
  }
};

const searchContacts = (req, res, next) => {
  try {
    const { q, accountId, limit } = req.query;
    const contacts = Contact.search(q, {
      accountId: accountId ? Number(accountId) : undefined,
      limit: limit ? Number(limit) : undefined
    });
    res.json({ success: true, data: contacts });
  } catch (err) {
    next(ApiError.from(err));
  }
};

// Kontakt nach ID abrufen
const getContactById = (req, res, next) => {
  try {
    const contact = Contact.getById(req.params.id);
    if (contact) {
      res.json({ success: true, data: contact });
    } else {
      next(new ApiError(404, 'Kontakt nicht gefunden', { code: 'CONTACT_NOT_FOUND' }));
    }
  } catch (err) {
    next(ApiError.from(err));
  }
};

// Kontakte nach Account-ID abrufen
const getContactsByAccountId = (req, res, next) => {
  try {
    const contacts = Contact.getByAccountId(req.params.accountId);
    res.json({ success: true, data: contacts });
  } catch (err) {
    next(ApiError.from(err));
  }
};

// Neuen Kontakt erstellen
const createContact = (req, res, next) => {
  try {
    const newContact = Contact.create(req.body);
    res.status(201).json({ success: true, data: newContact });
  } catch (err) {
    next(ApiError.from(err));
  }
};

// Kontakt aktualisieren
const updateContact = (req, res, next) => {
  try {
    const updatedContact = Contact.update(req.params.id, req.body);
    res.json({ success: true, data: updatedContact });
  } catch (err) {
    next(ApiError.from(err));
  }
};

// Kontakt löschen
const deleteContact = (req, res, next) => {
  try {
    Contact.delete(req.params.id);
    res.json({ success: true, message: 'Kontakt erfolgreich gelöscht' });
  } catch (err) {
    next(ApiError.from(err));
  }
};

module.exports = {
  getAllContacts,
  searchContacts,
  getContactById,
  getContactsByAccountId,
  createContact,
  updateContact,
  deleteContact
};
