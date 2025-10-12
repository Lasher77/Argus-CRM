import apiClient from './apiClient';

// Account-bezogene API-Aufrufe
const AccountService = {
  // Alle Accounts abrufen
  getAllAccounts: async () => {
    try {
      const response = await apiClient.get('/accounts');
      return response.data;
    } catch (error) {
      console.error('Fehler beim Abrufen der Accounts:', error);
      throw error;
    }
  },

  searchAccounts: async (query, options = {}) => {
    try {
      const response = await apiClient.get('/accounts/search', {
        params: {
          q: query,
          limit: options.limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Fehler bei der Suche nach Accounts:', error);
      throw error;
    }
  },

  // Account nach ID abrufen
  getAccountById: async (id) => {
    try {
      const response = await apiClient.get(`/accounts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Accounts mit ID ${id}:`, error);
      throw error;
    }
  },

  // Neuen Account erstellen
  createAccount: async (accountData) => {
    try {
      const response = await apiClient.post('/accounts', accountData);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Accounts:', error);
      throw error;
    }
  },

  // Account aktualisieren
  updateAccount: async (id, accountData) => {
    try {
      const response = await apiClient.put(`/accounts/${id}`, accountData);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Accounts mit ID ${id}:`, error);
      throw error;
    }
  },

  // Account löschen
  deleteAccount: async (id) => {
    try {
      const response = await apiClient.delete(`/accounts/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Löschen des Accounts mit ID ${id}:`, error);
      throw error;
    }
  },

  // Kontakte eines Accounts abrufen
  getAccountContacts: async (id) => {
    try {
      const response = await apiClient.get(`/accounts/${id}/contacts`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen der Kontakte für Account mit ID ${id}:`, error);
      throw error;
    }
  },

  // Hausobjekte eines Accounts abrufen
  getAccountProperties: async (id) => {
    try {
      const response = await apiClient.get(`/accounts/${id}/properties`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen der Hausobjekte für Account mit ID ${id}:`, error);
      throw error;
    }
  }
};

export default AccountService;
