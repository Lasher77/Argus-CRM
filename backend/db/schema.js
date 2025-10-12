// db/schema.js
const db = require('./database');

const columnExists = (table, column) => {
  const pragma = db.prepare(`PRAGMA table_info(${table})`).all();
  return pragma.some((info) => info.name === column);
};

const ensureColumn = (table, column, definition) => {
  if (!columnExists(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

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
      address TEXT NOT NULL,
      city TEXT,
      postal_code TEXT,
      country TEXT,
      contact_id INTEGER,
      notes TEXT,
      alt_invoice_address TEXT,
      latitude REAL,
      longitude REAL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(contact_id)
    )
  `);

  ensureColumn('properties', 'latitude', 'REAL');
  ensureColumn('properties', 'longitude', 'REAL');

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

  // Materialien / Lagerverwaltung
  db.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      material_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT,
      unit TEXT NOT NULL,
      stock REAL NOT NULL DEFAULT 0,
      reorder_level REAL NOT NULL DEFAULT 0,
      supplier_name TEXT,
      supplier_article_number TEXT,
      supplier_price REAL,
      notes TEXT,
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

  // PDF-Vorlagen
  db.exec(`
    CREATE TABLE IF NOT EXISTS pdf_templates (
      template_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      layout_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Mitarbeitende
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'field',
      is_field_worker INTEGER NOT NULL DEFAULT 1,
      color TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Serviceaufträge / Einsätze
  db.exec(`
    CREATE TABLE IF NOT EXISTS service_orders (
      order_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      account_id INTEGER NOT NULL,
      property_id INTEGER,
      service_recipient_contact_id INTEGER,
      invoice_account_id INTEGER,
      status TEXT NOT NULL DEFAULT 'planned',
      priority TEXT DEFAULT 'normal',
      planned_date TEXT,
      planned_start TEXT,
      planned_end TEXT,
      actual_start TEXT,
      actual_end TEXT,
      estimated_hours REAL,
      google_event_id TEXT,
      outlook_event_id TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE RESTRICT,
      FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE SET NULL,
      FOREIGN KEY (service_recipient_contact_id) REFERENCES contacts(contact_id) ON DELETE SET NULL,
      FOREIGN KEY (invoice_account_id) REFERENCES accounts(account_id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES employees(employee_id) ON DELETE SET NULL
    )
  `);

  // Einsatzplanung / Mitarbeiterzuweisungen
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_assignments (
      assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      scheduled_date TEXT,
      scheduled_start TEXT,
      scheduled_end TEXT,
      is_primary INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES service_orders(order_id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
    )
  `);

  // Digitale Zeiterfassung / GPS Check-ins
  db.exec(`
    CREATE TABLE IF NOT EXISTS time_entries (
      time_entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration_minutes INTEGER,
      source TEXT DEFAULT 'manual',
      start_lat REAL,
      start_lng REAL,
      end_lat REAL,
      end_lng REAL,
      distance_km REAL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES service_orders(order_id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
    )
  `);

  // Materialverbrauch pro Auftrag
  db.exec(`
    CREATE TABLE IF NOT EXISTS material_usage (
      usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      employee_id INTEGER,
      material_id INTEGER,
      material_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      unit_price REAL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES service_orders(order_id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
      FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE SET NULL
    )
  `);

  // Fotodokumentation
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_photos (
      photo_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      employee_id INTEGER,
      photo_data TEXT,
      caption TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES service_orders(order_id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL
    )
  `);

  // Digitale Unterschriften
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_signatures (
      signature_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL UNIQUE,
      signed_by TEXT,
      signed_at TEXT DEFAULT (datetime('now')),
      signature_data TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES service_orders(order_id) ON DELETE CASCADE
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
      role TEXT NOT NULL DEFAULT 'WORKER',
      is_active INTEGER DEFAULT 1,
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Systemeinstellungen
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      revoked_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
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
    CREATE INDEX IF NOT EXISTS idx_materials_reorder ON materials(stock, reorder_level);
    CREATE INDEX IF NOT EXISTS idx_service_orders_planned_date ON service_orders(planned_date);
    CREATE INDEX IF NOT EXISTS idx_order_assignments_order_id ON order_assignments(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_assignments_employee_id ON order_assignments(employee_id);
    CREATE INDEX IF NOT EXISTS idx_time_entries_order_id ON time_entries(order_id);
    CREATE INDEX IF NOT EXISTS idx_time_entries_employee_id ON time_entries(employee_id);
    CREATE INDEX IF NOT EXISTS idx_material_usage_order_id ON material_usage(order_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
  `);

  if (process.env.NODE_ENV !== 'test') {
    console.log('Datenbanktabellen wurden erfolgreich erstellt.');
  }
}

// Funktion zum Löschen aller Tabellen (für Testzwecke)
function dropTables() {
  const tables = [
    'order_signatures',
    'order_photos',
    'material_usage',
    'time_entries',
    'order_assignments',
    'service_orders',
    'invoice_items',
    'invoices',
    'quote_items',
    'quotes',
    'property_contacts',
    'properties',
    'contacts',
    'materials',
    'employees',
    'products',
    'pdf_templates',
    'refresh_tokens',
    'system_settings',
    'users',
    'accounts'
  ];

  db.pragma('foreign_keys = OFF');
  
  tables.forEach(table => {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
  });
  
  db.pragma('foreign_keys = ON');
  
  if (process.env.NODE_ENV !== 'test') {
    console.log('Alle Tabellen wurden gelöscht.');
  }
}

module.exports = {
  createTables,
  dropTables
};
