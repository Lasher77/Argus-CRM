-- PostgreSQL Datenbankschema für CRM-System

-- Accounts (Hausverwaltungen)
CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    tax_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Kontakte
CREATE TABLE contacts (
    contact_id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    birthday DATE,
    is_primary_contact BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Hausobjekte
CREATE TABLE properties (
    property_id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    contact_id INTEGER REFERENCES contacts(contact_id),
    notes TEXT,
    alt_invoice_address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Verknüpfungstabelle Hausobjekt-Kontakt
CREATE TABLE property_contacts (
    property_contact_id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE CASCADE,
    role VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(property_id, contact_id)
);

-- Produkte
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50) NOT NULL, -- 'piece' oder 'hour'
    price DECIMAL(10, 2) NOT NULL,
    vat_rate DECIMAL(5, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Materialien / Lagerverwaltung
CREATE TABLE materials (
    material_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    unit VARCHAR(50) NOT NULL,
    stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
    reorder_level NUMERIC(12, 2) NOT NULL DEFAULT 0,
    supplier_name VARCHAR(255),
    supplier_article_number VARCHAR(100),
    supplier_price NUMERIC(12, 2),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Angebote
CREATE TABLE quotes (
    quote_id SERIAL PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(account_id) ON DELETE RESTRICT,
    property_id INTEGER REFERENCES properties(property_id) ON DELETE RESTRICT,
    contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE RESTRICT,
    quote_number VARCHAR(50) NOT NULL UNIQUE,
    quote_date DATE NOT NULL,
    valid_until DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'created', -- 'created', 'sent', 'accepted', 'rejected'
    total_net DECIMAL(12, 2) NOT NULL,
    total_gross DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Angebotspositionen
CREATE TABLE quote_items (
    quote_item_id SERIAL PRIMARY KEY,
    quote_id INTEGER NOT NULL REFERENCES quotes(quote_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    vat_rate DECIMAL(5, 2) NOT NULL,
    total_net DECIMAL(12, 2) NOT NULL,
    total_gross DECIMAL(12, 2) NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Rechnungen
CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,
    quote_id INTEGER REFERENCES quotes(quote_id) ON DELETE RESTRICT,
    account_id INTEGER NOT NULL REFERENCES accounts(account_id) ON DELETE RESTRICT,
    property_id INTEGER REFERENCES properties(property_id) ON DELETE RESTRICT,
    contact_id INTEGER NOT NULL REFERENCES contacts(contact_id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'created', -- 'created', 'sent', 'partially_paid', 'paid', 'cancelled'
    total_net DECIMAL(12, 2) NOT NULL,
    total_gross DECIMAL(12, 2) NOT NULL,
    amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_terms TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Rechnungspositionen
CREATE TABLE invoice_items (
    invoice_item_id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    quote_item_id INTEGER REFERENCES quote_items(quote_item_id) ON DELETE RESTRICT,
    product_id INTEGER REFERENCES products(product_id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    vat_rate DECIMAL(5, 2) NOT NULL,
    total_net DECIMAL(12, 2) NOT NULL,
    total_gross DECIMAL(12, 2) NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Mitarbeitende
CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'field',
    is_field_worker BOOLEAN NOT NULL DEFAULT TRUE,
    color VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Serviceaufträge
CREATE TABLE service_orders (
    order_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    account_id INTEGER NOT NULL REFERENCES accounts(account_id) ON DELETE RESTRICT,
    property_id INTEGER REFERENCES properties(property_id) ON DELETE SET NULL,
    service_recipient_contact_id INTEGER REFERENCES contacts(contact_id) ON DELETE SET NULL,
    invoice_account_id INTEGER REFERENCES accounts(account_id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'planned',
    priority VARCHAR(20) DEFAULT 'normal',
    planned_date DATE,
    planned_start TIMESTAMP,
    planned_end TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    estimated_hours NUMERIC(8, 2),
    google_event_id VARCHAR(255),
    outlook_event_id VARCHAR(255),
    notes TEXT,
    created_by INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Einsatzplanung
CREATE TABLE order_assignments (
    assignment_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES service_orders(order_id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    scheduled_date DATE,
    scheduled_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Zeiterfassung / GPS Check-ins
CREATE TABLE time_entries (
    time_entry_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES service_orders(order_id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    source VARCHAR(50) DEFAULT 'manual',
    start_lat NUMERIC(10, 6),
    start_lng NUMERIC(10, 6),
    end_lat NUMERIC(10, 6),
    end_lng NUMERIC(10, 6),
    distance_km NUMERIC(10, 2),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Materialverbrauch
CREATE TABLE material_usage (
    usage_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES service_orders(order_id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
    material_id INTEGER REFERENCES materials(material_id) ON DELETE SET NULL,
    material_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price NUMERIC(12, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Fotodokumentation
CREATE TABLE order_photos (
    photo_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES service_orders(order_id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
    photo_data TEXT,
    caption TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Digitale Unterschriften
CREATE TABLE order_signatures (
    signature_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE REFERENCES service_orders(order_id) ON DELETE CASCADE,
    signed_by VARCHAR(255),
    signed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    signature_data TEXT NOT NULL
);

-- Benutzer
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin', 'user', 'readonly'
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indizes für Performance-Optimierung
CREATE INDEX idx_contacts_account_id ON contacts(account_id);
CREATE INDEX idx_properties_account_id ON properties(account_id);
CREATE INDEX idx_property_contacts_property_id ON property_contacts(property_id);
CREATE INDEX idx_property_contacts_contact_id ON property_contacts(contact_id);
CREATE INDEX idx_quotes_account_id ON quotes(account_id);
CREATE INDEX idx_quotes_property_id ON quotes(property_id);
CREATE INDEX idx_quotes_contact_id ON quotes(contact_id);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_items_product_id ON quote_items(product_id);
CREATE INDEX idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX idx_invoices_account_id ON invoices(account_id);
CREATE INDEX idx_invoices_property_id ON invoices(property_id);
CREATE INDEX idx_invoices_contact_id ON invoices(contact_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_quote_item_id ON invoice_items(quote_item_id);
CREATE INDEX idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX idx_materials_reorder ON materials(stock, reorder_level);
CREATE INDEX idx_service_orders_planned_date ON service_orders(planned_date);
CREATE INDEX idx_order_assignments_order_id ON order_assignments(order_id);
CREATE INDEX idx_order_assignments_employee_id ON order_assignments(employee_id);
CREATE INDEX idx_time_entries_order_id ON time_entries(order_id);
CREATE INDEX idx_time_entries_employee_id ON time_entries(employee_id);
CREATE INDEX idx_material_usage_order_id ON material_usage(order_id);

-- Trigger für automatische Aktualisierung des updated_at-Felds
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für alle Tabellen
CREATE TRIGGER update_accounts_modtime
    BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_contacts_modtime
    BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_properties_modtime
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_property_contacts_modtime
    BEFORE UPDATE ON property_contacts
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_products_modtime
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_quotes_modtime
    BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_quote_items_modtime
    BEFORE UPDATE ON quote_items
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_invoices_modtime
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_invoice_items_modtime
    BEFORE UPDATE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
