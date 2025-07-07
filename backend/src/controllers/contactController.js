// src/controllers/contactController.js
const Contact = require('../models/contact');

// Alle Kontakte abrufen
const getAllContacts = (req, res) => {
  try {
    const contacts = Contact.getAll();
    res.json({ success: true, data: contacts });
  } catch (err) {
    console.error('Fehler beim Abrufen der Kontakte:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Laden der Kontakte' });
  }
};

// Kontakt nach ID abrufen
const getContactById = (req, res) => {
  try {
    const contactId = parseInt(req.params.id, 10);
    if (isNaN(contactId)) {
      return res.status(400).json({ success: false, message: 'Ungültige Kontakt-ID' });
    }
    const contact = Contact.getById(contactId);
    if (contact) {
      res.json({ success: true, data: contact });
    } else {
      res.status(404).json({ success: false, message: 'Kontakt nicht gefunden' });
    }
  } catch (err) {
    console.error('Fehler beim Abrufen des Kontakts:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Laden des Kontakts' });
  }
};

// Kontakte nach Account-ID abrufen
const getContactsByAccountId = (req, res) => {
  try {
    const accountId = parseInt(req.params.accountId, 10);
    if (isNaN(accountId)) {
      return res.status(400).json({ success: false, message: 'Ungültige Account-ID' });
    }
    const contacts = Contact.getByAccountId(accountId);
    res.json({ success: true, data: contacts });
  } catch (err) {
    console.error('Fehler beim Abrufen der Kontakte:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Laden der Kontakte' });
  }
};

// Neuen Kontakt erstellen
const createContact = (req, res) => {
  try {
    const newContact = Contact.create(req.body);
    res.status(201).json({ success: true, data: newContact });
  } catch (err) {
    console.error('Fehler beim Erstellen des Kontakts:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Erstellen des Kontakts' });
  }
};

// Kontakt aktualisieren
const updateContact = (req, res) => {
  try {
    const contactId = parseInt(req.params.id, 10);
    if (isNaN(contactId)) {
      return res.status(400).json({ success: false, message: 'Ungültige Kontakt-ID' });
    }
    const updatedContact = Contact.update(contactId, req.body);
    res.json({ success: true, data: updatedContact });
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Kontakts:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Aktualisieren des Kontakts' });
  }
};

// Kontakt löschen
const deleteContact = (req, res) => {
  try {
    const contactId = parseInt(req.params.id, 10);
    if (isNaN(contactId)) {
      return res.status(400).json({ success: false, message: 'Ungültige Kontakt-ID' });
    }
    Contact.delete(contactId);
    res.json({ success: true, message: 'Kontakt erfolgreich gelöscht' });
  } catch (err) {
    console.error('Fehler beim Löschen des Kontakts:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Löschen des Kontakts' });
  }
};

module.exports = {
  getAllContacts,
  getContactById,
  getContactsByAccountId,
  createContact,
  updateContact,
  deleteContact
};
