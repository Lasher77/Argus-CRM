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
    const contact = Contact.getById(req.params.id);
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
    const contacts = Contact.getByAccountId(req.params.accountId);
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
    const updatedContact = Contact.update(req.params.id, req.body);
    res.json({ success: true, data: updatedContact });
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Kontakts:', err);
    res.status(500).json({ success: false, message: 'Fehler beim Aktualisieren des Kontakts' });
  }
};

// Kontakt löschen
const deleteContact = (req, res) => {
  try {
    Contact.delete(req.params.id);
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
