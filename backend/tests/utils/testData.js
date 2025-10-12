const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const initDatabase = require('../../db/init');
const db = require('../../db/database');

const hash = (password) => bcrypt.hashSync(password, 10);

const resetDatabaseFile = () => {
  const dbPath = process.env.TEST_DB_PATH;
  if (dbPath && dbPath !== ':memory:' && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
};

const seedTestData = () => {
  resetDatabaseFile();
  initDatabase(true);

  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
    VALUES (@username, @email, @password_hash, @first_name, @last_name, @role, @is_active)
  `);

  insertUser.run({
    username: 'admin',
    email: 'admin@example.com',
    password_hash: hash('admin123'),
    first_name: 'System',
    last_name: 'Administrator',
    role: 'ADMIN',
    is_active: 1,
  });

  insertUser.run({
    username: 'worker',
    email: 'worker@example.com',
    password_hash: hash('worker123'),
    first_name: 'Will',
    last_name: 'Worker',
    role: 'WORKER',
    is_active: 1,
  });

  const accountStmt = db.prepare(`
    INSERT INTO accounts (name, address, phone, email, website, tax_number, notes)
    VALUES (@name, @address, @phone, @email, @website, @tax_number, @notes)
  `);

  const accountId = accountStmt.run({
    name: 'Hausverwaltung Schmidt GmbH',
    address: 'Berliner Str. 123, 10115 Berlin',
    phone: '030 12345678',
    email: 'info@hv-schmidt.de',
    website: 'https://www.hv-schmidt.de',
    tax_number: '123/456/78910',
    notes: 'Referenzkunde für Tests.',
  }).lastInsertRowid;

  const account2Id = accountStmt.run({
    name: 'Immobilien Müller & Co.',
    address: 'Hauptstraße 45, 80331 München',
    phone: '089 87654321',
    email: 'kontakt@mueller-immobilien.de',
    website: 'https://www.mueller-immobilien.de',
    tax_number: '234/567/89101',
    notes: 'Weitere Testhausverwaltung.',
  }).lastInsertRowid;

  const contactStmt = db.prepare(`
    INSERT INTO contacts (
      account_id,
      first_name,
      last_name,
      position,
      phone,
      mobile,
      email,
      address,
      birthday,
      is_primary_contact,
      notes
    )
    VALUES (
      @account_id,
      @first_name,
      @last_name,
      @position,
      @phone,
      @mobile,
      @email,
      @address,
      @birthday,
      @is_primary_contact,
      @notes
    )
  `);

  const contactId = contactStmt.run({
    account_id: accountId,
    first_name: 'Thomas',
    last_name: 'Schmidt',
    position: 'Geschäftsführer',
    phone: '030 12345678',
    mobile: '0170 1234567',
    email: 't.schmidt@hv-schmidt.de',
    address: 'Berliner Str. 123, 10115 Berlin',
    birthday: '1975-05-15',
    is_primary_contact: 1,
    notes: 'Bevorzugt E-Mail.'
  }).lastInsertRowid;

  const propertyStmt = db.prepare(`
    INSERT INTO properties (
      account_id,
      contact_id,
      name,
      address,
      city,
      postal_code,
      country,
      notes,
      alt_invoice_address,
      latitude,
      longitude
    )
    VALUES (
      @account_id,
      @contact_id,
      @name,
      @address,
      @city,
      @postal_code,
      @country,
      @notes,
      @alt_invoice_address,
      @latitude,
      @longitude
    )
  `);

  const propertyId = propertyStmt.run({
    account_id: accountId,
    contact_id: contactId,
    name: 'Wohnanlage Mitte',
    address: 'Berliner Str. 123',
    city: 'Berlin',
    postal_code: '10115',
    country: 'Deutschland',
    notes: 'Wohnanlage mit 24 Einheiten.',
    alt_invoice_address: null,
    latitude: 52.5005,
    longitude: 13.4241,
  }).lastInsertRowid;

  const employeeStmt = db.prepare(`
    INSERT INTO employees (first_name, last_name, email, phone, role, is_field_worker, color)
    VALUES (@first_name, @last_name, @email, @phone, @role, @is_field_worker, @color)
  `);

  const employeeId = employeeStmt.run({
    first_name: 'Lena',
    last_name: 'Schneider',
    email: 'lena.schneider@werkassist.de',
    phone: '+49 171 1234567',
    role: 'field',
    is_field_worker: 1,
    color: '#F44336',
  }).lastInsertRowid;

  employeeStmt.run({
    first_name: 'Marco',
    last_name: 'Weber',
    email: 'marco.weber@werkassist.de',
    phone: '+49 172 9876543',
    role: 'field',
    is_field_worker: 1,
    color: '#2196F3',
  });

  const materialStmt = db.prepare(`
    INSERT INTO materials (name, sku, unit, stock, reorder_level, supplier_name, supplier_article_number, supplier_price, notes)
    VALUES (@name, @sku, @unit, @stock, @reorder_level, @supplier_name, @supplier_article_number, @supplier_price, @notes)
  `);

  materialStmt.run({
    name: 'Edelstahl-Handlauf 2m',
    sku: 'ES-HAND-200',
    unit: 'Stk.',
    stock: 2,
    reorder_level: 5,
    supplier_name: 'Metallgroßhandel Nord',
    supplier_article_number: 'MGN-5512',
    supplier_price: 89.5,
    notes: 'inkl. Schrauben und Dübel',
  });

  const productStmt = db.prepare(`
    INSERT INTO products (name, description, unit, price, vat_rate, is_active)
    VALUES (@name, @description, @unit, @price, @vat_rate, @is_active)
  `);

  const productId = productStmt.run({
    name: 'Wartung Brandschutztür',
    description: 'Jährliche Wartung der Brandschutztür inkl. Prüfprotokoll',
    unit: 'Einsatz',
    price: 120,
    vat_rate: 19,
    is_active: 1,
  }).lastInsertRowid;

  const serviceOrderStmt = db.prepare(`
    INSERT INTO service_orders (
      title,
      description,
      account_id,
      property_id,
      service_recipient_contact_id,
      invoice_account_id,
      status,
      priority,
      planned_date,
      planned_start,
      planned_end,
      actual_start,
      actual_end,
      estimated_hours,
      google_event_id,
      outlook_event_id,
      notes,
      created_by
    )
    VALUES (
      @title,
      @description,
      @account_id,
      @property_id,
      @service_recipient_contact_id,
      @invoice_account_id,
      @status,
      @priority,
      @planned_date,
      @planned_start,
      @planned_end,
      @actual_start,
      @actual_end,
      @estimated_hours,
      @google_event_id,
      @outlook_event_id,
      @notes,
      @created_by
    )
  `);

  const serviceOrderId = serviceOrderStmt.run({
    title: 'Türschließer Austausch Bürogebäude Kreuzberg',
    description: 'Austausch der Türschließer inklusive Justierung.',
    account_id: accountId,
    property_id: propertyId,
    service_recipient_contact_id: contactId,
    invoice_account_id: accountId,
    status: 'planned',
    priority: 'medium',
    planned_date: '2025-04-06',
    planned_start: '2025-04-06T09:00:00',
    planned_end: '2025-04-06T13:00:00',
    actual_start: null,
    actual_end: null,
    estimated_hours: 4,
    google_event_id: null,
    outlook_event_id: null,
    notes: 'Zutritt über Hintereingang, Schlüssel liegt bei Hausmeister.',
    created_by: 1,
  }).lastInsertRowid;

  const assignmentStmt = db.prepare(`
    INSERT INTO order_assignments (order_id, employee_id, scheduled_date, scheduled_start, scheduled_end, is_primary)
    VALUES (@order_id, @employee_id, @scheduled_date, @scheduled_start, @scheduled_end, @is_primary)
  `);

  assignmentStmt.run({
    order_id: serviceOrderId,
    employee_id: employeeId,
    scheduled_date: '2025-04-06',
    scheduled_start: '2025-04-06T09:00:00',
    scheduled_end: '2025-04-06T13:00:00',
    is_primary: 1,
  });

  const timeEntryStmt = db.prepare(`
    INSERT INTO time_entries (
      order_id,
      employee_id,
      start_time,
      end_time,
      duration_minutes,
      source,
      start_lat,
      start_lng,
      end_lat,
      end_lng,
      distance_km,
      notes
    )
    VALUES (
      @order_id,
      @employee_id,
      @start_time,
      @end_time,
      @duration_minutes,
      @source,
      @start_lat,
      @start_lng,
      @end_lat,
      @end_lng,
      @distance_km,
      @notes
    )
  `);

  timeEntryStmt.run({
    order_id: serviceOrderId,
    employee_id: employeeId,
    start_time: '2025-04-05T08:05:00',
    end_time: '2025-04-05T11:30:00',
    duration_minutes: 205,
    source: 'mobile',
    start_lat: 52.5005,
    start_lng: 13.4241,
    end_lat: 52.5005,
    end_lng: 13.4241,
    distance_km: 12.4,
    notes: 'Vor-Ort-Termin abgeschlossen.',
  });

  const quoteStmt = db.prepare(`
    INSERT INTO quotes (
      account_id,
      property_id,
      contact_id,
      quote_number,
      quote_date,
      valid_until,
      status,
      total_net,
      total_gross,
      notes
    )
    VALUES (
      @account_id,
      @property_id,
      @contact_id,
      @quote_number,
      @quote_date,
      @valid_until,
      @status,
      @total_net,
      @total_gross,
      @notes
    )
  `);

  const quoteId = quoteStmt.run({
    account_id: accountId,
    property_id: propertyId,
    contact_id: contactId,
    quote_number: 'ANG-2025-001',
    quote_date: '2025-04-02',
    valid_until: '2025-05-02',
    status: 'sent',
    total_net: 240,
    total_gross: 285.6,
    notes: 'Wartung Angebot',
  }).lastInsertRowid;

  const quoteItemStmt = db.prepare(`
    INSERT INTO quote_items (
      quote_id,
      product_id,
      description,
      quantity,
      unit,
      unit_price,
      vat_rate,
      total_net,
      total_gross,
      position
    )
    VALUES (
      @quote_id,
      @product_id,
      @description,
      @quantity,
      @unit,
      @unit_price,
      @vat_rate,
      @total_net,
      @total_gross,
      @position
    )
  `);

  const quoteItemId = quoteItemStmt.run({
    quote_id: quoteId,
    product_id: productId,
    description: 'Wartung Brandschutztür',
    quantity: 2,
    unit: 'Stück',
    unit_price: 120,
    vat_rate: 19,
    total_net: 240,
    total_gross: 285.6,
    position: 1,
  }).lastInsertRowid;

  const invoiceStmt = db.prepare(`
    INSERT INTO invoices (
      quote_id,
      account_id,
      property_id,
      contact_id,
      invoice_number,
      invoice_date,
      due_date,
      status,
      total_net,
      total_gross,
      amount_paid,
      payment_terms,
      notes
    )
    VALUES (
      @quote_id,
      @account_id,
      @property_id,
      @contact_id,
      @invoice_number,
      @invoice_date,
      @due_date,
      @status,
      @total_net,
      @total_gross,
      @amount_paid,
      @payment_terms,
      @notes
    )
  `);

  const invoiceId = invoiceStmt.run({
    quote_id: quoteId,
    account_id: accountId,
    property_id: propertyId,
    contact_id: contactId,
    invoice_number: 'RE-2025-001',
    invoice_date: '2025-04-10',
    due_date: '2025-04-24',
    status: 'sent',
    total_net: 240,
    total_gross: 285.6,
    amount_paid: 0,
    payment_terms: 'Zahlbar innerhalb von 14 Tagen netto',
    notes: 'Automatisch erstellt.',
  }).lastInsertRowid;

  const invoiceItemStmt = db.prepare(`
    INSERT INTO invoice_items (
      invoice_id,
      quote_item_id,
      product_id,
      description,
      quantity,
      unit,
      unit_price,
      vat_rate,
      total_net,
      total_gross,
      position
    )
    VALUES (
      @invoice_id,
      @quote_item_id,
      @product_id,
      @description,
      @quantity,
      @unit,
      @unit_price,
      @vat_rate,
      @total_net,
      @total_gross,
      @position
    )
  `);

  invoiceItemStmt.run({
    invoice_id: invoiceId,
    quote_item_id: quoteItemId,
    product_id: productId,
    description: 'Wartung Brandschutztür',
    quantity: 2,
    unit: 'Stück',
    unit_price: 120,
    vat_rate: 19,
    total_net: 240,
    total_gross: 285.6,
    position: 1,
  });
};

module.exports = {
  seedTestData,
};
