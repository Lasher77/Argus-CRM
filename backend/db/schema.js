// db/schema.js
const db = require('./database');

// Funktion zum Erstellen der Tabellen
function createTables() {
  // Accounts (Hausverwaltungen)
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      account_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      tax_number TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Kontakte
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      position TEXT,
      phone TEXT,
      mobile TEXT,
      email TEXT,
      address TEXT,
      birthday TEXT,
      is_primary_contact INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
    )
  `);

  // Hausobjekte
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      property_id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      street TEXT NOT NULL,
      house_number TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      city TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE
    )
  `);

  // Verknüpfungstabelle Hausobjekt-Kontakt
  db.exec(`
    CREATE TABLE IF NOT EXISTS property_contacts (
      property_contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      role TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(contact_id) ON DELETE CASCADE,
      UNIQUE(property_id, contact_id)
    )
  `);

  // Produkte
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      product_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      unit TEXT NOT NULL,
      price REAL NOT NULL,
      vat_rate REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Angebote
  db.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      quote_id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      property_id INTEGER,
      contact_id INTEGER, -- Made nullable
      quote_number TEXT NOT NULL UNIQUE,
      quote_date TEXT NOT NULL,
      valid_until TEXT,
      status TEXT NOT NULL DEFAULT 'created',
      total_net REAL NOT NULL,
      total_gross REAL NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE RESTRICT,
      FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE RESTRICT,
      FOREIGN KEY (contact_id) REFERENCES contacts(contact_id) ON DELETE RESTRICT
    )
  `);

  // Angebotspositionen
  db.exec(`
    CREATE TABLE IF NOT EXISTS quote_items (
      quote_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      product_id INTEGER,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      unit_price REAL NOT NULL,
      vat_rate REAL NOT NULL,
      total_net REAL NOT NULL,
      total_gross REAL NOT NULL,
      position INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (quote_id) REFERENCES quotes(quote_id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT
    )
  `);

  // Rechnungen
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER,
      account_id INTEGER NOT NULL,
      property_id INTEGER,
      contact_id INTEGER, -- Made nullable
      invoice_number TEXT NOT NULL UNIQUE,
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'created',
      total_net REAL NOT NULL,
      total_gross REAL NOT NULL,
      amount_paid REAL NOT NULL DEFAULT 0,
      payment_terms TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (quote_id) REFERENCES quotes(quote_id) ON DELETE RESTRICT,
      FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE RESTRICT,
      FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE RESTRICT,
      FOREIGN KEY (contact_id) REFERENCES contacts(contact_id) ON DELETE RESTRICT
    )
  `);

  // Rechnungspositionen
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      invoice_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      quote_item_id INTEGER,
      product_id INTEGER,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      unit_price REAL NOT NULL,
      vat_rate REAL NOT NULL,
      total_net REAL NOT NULL,
      total_gross REAL NOT NULL,
      position INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
      FOREIGN KEY (quote_item_id) REFERENCES quote_items(quote_item_id) ON DELETE RESTRICT,
      FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT
    )
  `);

  // Benutzer
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Indizes für Performance-Optimierung
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_contacts_account_id ON contacts(account_id);
    CREATE INDEX IF NOT EXISTS idx_properties_account_id ON properties(account_id);
    CREATE INDEX IF NOT EXISTS idx_property_contacts_property_id ON property_contacts(property_id);
    CREATE INDEX IF NOT EXISTS idx_property_contacts_contact_id ON property_contacts(contact_id);
    CREATE INDEX IF NOT EXISTS idx_quotes_account_id ON quotes(account_id);
    CREATE INDEX IF NOT EXISTS idx_quotes_property_id ON quotes(property_id);
    CREATE INDEX IF NOT EXISTS idx_quotes_contact_id ON quotes(contact_id);
    CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
    CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON quote_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices(quote_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_account_id ON invoices(account_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_property_id ON invoices(property_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_contact_id ON invoices(contact_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_items_quote_item_id ON invoice_items(quote_item_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);
  `);

  console.log('Datenbanktabellen wurden erfolgreich erstellt.');
}

// Funktion zum Löschen aller Tabellen (für Testzwecke)
function dropTables() {
  const tables = [
    'invoice_items',
    'invoices',
    'quote_items',
    'quotes',
    'property_contacts',
    'properties',
    'contacts',
    'products',
    'users',
    'accounts'
  ];

  db.pragma('foreign_keys = OFF');
  
  tables.forEach(table => {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
  });
  
  db.pragma('foreign_keys = ON');
  
  console.log('Alle Tabellen wurden gelöscht.');
}

module.exports = {
  createTables,
  dropTables
};
