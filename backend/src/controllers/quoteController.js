// src/controllers/quoteController.js
const Quote = require("../models/quote");

// Alle Angebote abrufen
const getAllQuotes = (req, res) => {
  try {
    const quotes = Quote.getAll();
    res.json({ success: true, data: quotes });
  } catch (err) {
    console.error("Fehler beim Abrufen der Angebote:", err);
    res
      .status(500)
      .json({ success: false, message: "Fehler beim Laden der Angebote" });
  }
};

// Angebot nach ID abrufen
const getQuoteById = (req, res) => {
  try {
    const quote = Quote.getById(req.params.id);
    if (quote) {
      // Angebotspositionen abrufen
      const items = Quote.getItems(req.params.id);
      // Stelle sicher, dass items immer ein Array ist, auch wenn die Model-Funktion es bereits tut
      const responseItems = Array.isArray(items) ? items : [];
      res.json({
        success: true,
        data: {
          ...quote,
          items: responseItems, // Garantiert ein Array
        },
      });
    } else {
      res.status(404).json({ success: false, message: "Angebot nicht gefunden" });
    }
  } catch (err) {
    console.error("Fehler beim Abrufen des Angebots:", err);
    res
      .status(500)
      .json({ success: false, message: "Fehler beim Laden des Angebots" });
  }
};

// Angebote nach Account-ID abrufen
const getQuotesByAccountId = (req, res) => {
  try {
    const quotes = Quote.getByAccountId(req.params.accountId);
    res.json({ success: true, data: quotes });
  } catch (err) {
    console.error("Fehler beim Abrufen der Angebote:", err);
    res
      .status(500)
      .json({ success: false, message: "Fehler beim Laden der Angebote" });
  }
};

// Neues Angebot erstellen
const createQuote = (req, res) => {
  try {
    const { items, ...quoteData } = req.body;

    // *** GEÄNDERT: Überprüfung auf property_id statt contact_id ***
    if (!quoteData.property_id) {
        return res.status(400).json({ success: false, message: "Fehlende property_id (Hausobjekt) im Request Body" });
    }
    // *** ENDE GEÄNDERT ***

    const newQuote = Quote.create(quoteData);

    // Angebotspositionen hinzufügen, falls vorhanden
    if (items && Array.isArray(items)) {
      items.forEach((item) => {
        Quote.addItem(newQuote.quote_id, item);
      });
    }

    // Angebot mit Positionen zurückgeben
    const createdItems = Quote.getItems(newQuote.quote_id);
    res.status(201).json({
      success: true,
      data: {
        ...newQuote,
        items: createdItems, // Garantiert ein Array
      },
    });
  } catch (err) {
    console.error("Fehler beim Erstellen des Angebots:", err);
    // Spezifischere Fehlermeldung für NOT NULL constraint
    if (err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
        return res.status(400).json({ success: false, message: `Fehlender Pflichtwert: ${err.message}` });
    }
    res
      .status(500)
      .json({ success: false, message: "Fehler beim Erstellen des Angebots" });
  }
};

// Angebot aktualisieren
const updateQuote = (req, res) => {
  try {
    const { items, ...quoteData } = req.body;
    const quoteId = req.params.id;

    // *** GEÄNDERT: Überprüfung auf property_id statt contact_id ***
    if (!quoteData.property_id) {
        return res.status(400).json({ success: false, message: "Fehlende property_id (Hausobjekt) im Request Body" });
    }
    // *** ENDE GEÄNDERT ***

    const updatedQuote = Quote.update(quoteId, quoteData);

    // Angebotspositionen aktualisieren, falls vorhanden
    if (items && Array.isArray(items)) {
      // Bestehende Positionen löschen und neue hinzufügen
      const existingItems = Quote.getItems(quoteId);
      existingItems.forEach((item) => {
        Quote.deleteItem(item.quote_item_id);
      });

      items.forEach((item) => {
        Quote.addItem(updatedQuote.quote_id, item);
      });
    }

    // Angebot mit aktualisierten Positionen zurückgeben
    const updatedItems = Quote.getItems(updatedQuote.quote_id);
    res.json({
      success: true,
      data: {
        ...updatedQuote,
        items: updatedItems, // Garantiert ein Array
      },
    });
  } catch (err) {
    console.error("Fehler beim Aktualisieren des Angebots:", err);
    // Spezifischere Fehlermeldung für NOT NULL constraint
    if (err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
        return res.status(400).json({ success: false, message: `Fehlender Pflichtwert: ${err.message}` });
    }
    res
      .status(500)
      .json({ success: false, message: "Fehler beim Aktualisieren des Angebots" });
  }
};

// Angebot löschen
const deleteQuote = (req, res) => {
  try {
    const quoteId = req.params.id;
    // Zuerst alle Angebotspositionen löschen
    const items = Quote.getItems(quoteId);
    items.forEach((item) => {
      Quote.deleteItem(item.quote_item_id);
    });

    // Dann das Angebot löschen
    Quote.delete(quoteId);
    res.json({ success: true, message: "Angebot erfolgreich gelöscht" });
  } catch (err) {
    console.error("Fehler beim Löschen des Angebots:", err);
    res
      .status(500)
      .json({ success: false, message: "Fehler beim Löschen des Angebots" });
  }
};

// Angebotsposition hinzufügen
const addQuoteItem = (req, res) => {
  try {
    const newItem = Quote.addItem(req.params.quoteId, req.body);
    res.status(201).json({ success: true, data: newItem });
  } catch (err) {
    console.error("Fehler beim Hinzufügen der Angebotsposition:", err);
    res.status(500).json({
      success: false,
      message: "Fehler beim Hinzufügen der Angebotsposition",
    });
  }
};

// Angebotsposition aktualisieren
const updateQuoteItem = (req, res) => {
  try {
    const updatedItem = Quote.updateItem(req.params.itemId, req.body);
    res.json({ success: true, data: updatedItem });
  } catch (err) {
    console.error("Fehler beim Aktualisieren der Angebotsposition:", err);
    res.status(500).json({
      success: false,
      message: "Fehler beim Aktualisieren der Angebotsposition",
    });
  }
};

// Angebotsposition löschen
const deleteQuoteItem = (req, res) => {
  try {
    Quote.deleteItem(req.params.itemId);
    res.json({ success: true, message: "Angebotsposition erfolgreich gelöscht" });
  } catch (err) {
    console.error("Fehler beim Löschen der Angebotsposition:", err);
    res.status(500).json({
      success: false,
      message: "Fehler beim Löschen der Angebotsposition",
    });
  }
};

module.exports = {
  getAllQuotes,
  getQuoteById,
  getQuotesByAccountId,
  createQuote,
  updateQuote,
  deleteQuote,
  addQuoteItem,
  updateQuoteItem,
  deleteQuoteItem,
};

