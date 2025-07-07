// src/controllers/accountController.js
const Account = require('../models/account');

// Account Controller
const accountController = {
  // Alle Accounts abrufen
  getAllAccounts: (req, res) => {
    try {
      const accounts = Account.getAll();
      res.json({ success: true, data: accounts });
    } catch (error) {
      console.error('Fehler beim Abrufen der Accounts:', error);
      res.status(500).json({ success: false, message: 'Interner Serverfehler' });
    }
  },

  // Account nach ID abrufen
  getAccountById: (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const account = Account.getById(accountId);
      
      if (!account) {
        return res.status(404).json({ success: false, message: 'Account nicht gefunden' });
      }
      
      res.json({ success: true, data: account });
    } catch (error) {
      console.error('Fehler beim Abrufen des Accounts:', error);
      res.status(500).json({ success: false, message: 'Interner Serverfehler' });
    }
  },

  // Neuen Account erstellen
  createAccount: (req, res) => {
    try {
      const { name, address, phone, email, website, tax_number, notes } = req.body;
      
      // Validierung
      if (!name) {
        return res.status(400).json({ success: false, message: 'Name ist erforderlich' });
      }
      
      const accountData = { name, address, phone, email, website, tax_number, notes };
      const newAccountId = Account.create(accountData);
      
      res.status(201).json({ 
        success: true, 
        message: 'Account erfolgreich erstellt', 
        data: { account_id: newAccountId } 
      });
    } catch (error) {
      console.error('Fehler beim Erstellen des Accounts:', error);
      res.status(500).json({ success: false, message: 'Interner Serverfehler' });
    }
  },

  // Account aktualisieren
  updateAccount: (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const { name, address, phone, email, website, tax_number, notes } = req.body;
      
      // Validierung
      if (!name) {
        return res.status(400).json({ success: false, message: 'Name ist erforderlich' });
      }
      
      // Prüfen, ob Account existiert
      const existingAccount = Account.getById(accountId);
      if (!existingAccount) {
        return res.status(404).json({ success: false, message: 'Account nicht gefunden' });
      }
      
      const accountData = { name, address, phone, email, website, tax_number, notes };
      const success = Account.update(accountId, accountData);
      
      if (success) {
        res.json({ success: true, message: 'Account erfolgreich aktualisiert' });
      } else {
        res.status(500).json({ success: false, message: 'Fehler beim Aktualisieren des Accounts' });
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Accounts:', error);
      res.status(500).json({ success: false, message: 'Interner Serverfehler' });
    }
  },

  // Account löschen
  deleteAccount: (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      
      // Prüfen, ob Account existiert
      const existingAccount = Account.getById(accountId);
      if (!existingAccount) {
        return res.status(404).json({ success: false, message: 'Account nicht gefunden' });
      }
      
      const success = Account.delete(accountId);
      
      if (success) {
        res.json({ success: true, message: 'Account erfolgreich gelöscht' });
      } else {
        res.status(500).json({ success: false, message: 'Fehler beim Löschen des Accounts' });
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Accounts:', error);
      res.status(500).json({ success: false, message: 'Interner Serverfehler' });
    }
  },

  // Kontakte eines Accounts abrufen
  getAccountContacts: (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      
      // Prüfen, ob Account existiert
      const existingAccount = Account.getById(accountId);
      if (!existingAccount) {
        return res.status(404).json({ success: false, message: 'Account nicht gefunden' });
      }
      
      const contacts = Account.getContacts(accountId);
      res.json({ success: true, data: contacts });
    } catch (error) {
      console.error('Fehler beim Abrufen der Kontakte:', error);
      res.status(500).json({ success: false, message: 'Interner Serverfehler' });
    }
  },

  // Hausobjekte eines Accounts abrufen
  getAccountProperties: (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      
      // Prüfen, ob Account existiert
      const existingAccount = Account.getById(accountId);
      if (!existingAccount) {
        return res.status(404).json({ success: false, message: 'Account nicht gefunden' });
      }
      
      const properties = Account.getProperties(accountId);
      res.json({ success: true, data: properties });
    } catch (error) {
      console.error('Fehler beim Abrufen der Hausobjekte:', error);
      res.status(500).json({ success: false, message: 'Interner Serverfehler' });
    }
  }
};

module.exports = accountController;
