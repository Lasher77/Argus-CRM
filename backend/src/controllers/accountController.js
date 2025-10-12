// src/controllers/accountController.js
const Account = require('../models/account');
const { ApiError } = require('../utils/apiError');

// Account Controller
const accountController = {
  // Alle Accounts abrufen
  getAllAccounts: (req, res, next) => {
    try {
      const accounts = Account.getAll();
      res.json({ success: true, data: accounts });
    } catch (error) {
      next(ApiError.from(error));
    }
  },

  searchAccounts: (req, res, next) => {
    try {
      const { q, limit } = req.query;
      const accounts = Account.search(q, limit ? Number(limit) : undefined);
      res.json({ success: true, data: accounts });
    } catch (error) {
      next(ApiError.from(error));
    }
  },

  // Account nach ID abrufen
  getAccountById: (req, res, next) => {
    try {
      const account = Account.getById(req.params.id);

      if (!account) {
        return next(new ApiError(404, 'Account nicht gefunden', { code: 'ACCOUNT_NOT_FOUND' }));
      }

      res.json({ success: true, data: account });
    } catch (error) {
      next(ApiError.from(error));
    }
  },

  // Neuen Account erstellen
  createAccount: (req, res, next) => {
    try {
      const newAccountId = Account.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Account erfolgreich erstellt',
        data: { account_id: newAccountId }
      });
    } catch (error) {
      next(ApiError.from(error));
    }
  },

  // Account aktualisieren
  updateAccount: (req, res, next) => {
    try {
      // Prüfen, ob Account existiert
      const existingAccount = Account.getById(req.params.id);
      if (!existingAccount) {
        return next(new ApiError(404, 'Account nicht gefunden', { code: 'ACCOUNT_NOT_FOUND' }));
      }

      const success = Account.update(req.params.id, req.body);

      if (success) {
        res.json({ success: true, message: 'Account erfolgreich aktualisiert' });
      } else {
        next(
          new ApiError(500, 'Fehler beim Aktualisieren des Accounts', {
            code: 'ACCOUNT_UPDATE_FAILED'
          })
        );
      }
    } catch (error) {
      next(ApiError.from(error));
    }
  },

  // Account löschen
  deleteAccount: (req, res, next) => {
    try {
      // Prüfen, ob Account existiert
      const existingAccount = Account.getById(req.params.id);
      if (!existingAccount) {
        return next(new ApiError(404, 'Account nicht gefunden', { code: 'ACCOUNT_NOT_FOUND' }));
      }

      const success = Account.delete(req.params.id);

      if (success) {
        res.json({ success: true, message: 'Account erfolgreich gelöscht' });
      } else {
        next(
          new ApiError(500, 'Fehler beim Löschen des Accounts', {
            code: 'ACCOUNT_DELETE_FAILED'
          })
        );
      }
    } catch (error) {
      next(ApiError.from(error));
    }
  },

  // Kontakte eines Accounts abrufen
  getAccountContacts: (req, res, next) => {
    try {
      // Prüfen, ob Account existiert
      const existingAccount = Account.getById(req.params.id);
      if (!existingAccount) {
        return next(new ApiError(404, 'Account nicht gefunden', { code: 'ACCOUNT_NOT_FOUND' }));
      }

      const contacts = Account.getContacts(req.params.id);
      res.json({ success: true, data: contacts });
    } catch (error) {
      next(ApiError.from(error));
    }
  },

  // Hausobjekte eines Accounts abrufen
  getAccountProperties: (req, res, next) => {
    try {
      // Prüfen, ob Account existiert
      const existingAccount = Account.getById(req.params.id);
      if (!existingAccount) {
        return next(new ApiError(404, 'Account nicht gefunden', { code: 'ACCOUNT_NOT_FOUND' }));
      }

      const properties = Account.getProperties(req.params.id);
      res.json({ success: true, data: properties });
    } catch (error) {
      next(ApiError.from(error));
    }
  }
};

module.exports = accountController;
