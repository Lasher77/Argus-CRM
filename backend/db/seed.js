// db/seed.js
const db = require('./database');
const initDatabase = require('./init.js');
const bcrypt = require('bcryptjs');

// Funktion zum Einfügen von Testdaten
function seedDatabase() {
  try {
    // Datenbank zurücksetzen und neu initialisieren
    initDatabase(true);
    
    console.log('Füge Testdaten ein...');

    const hashPassword = (password) => bcrypt.hashSync(password, 10);

    const authUsers = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password_hash: hashPassword('admin123'),
        first_name: 'System',
        last_name: 'Administrator',
        role: 'ADMIN',
        is_active: 1
      },
      {
        username: 'accounting',
        email: 'accounting@example.com',
        password_hash: hashPassword('accounting123'),
        first_name: 'Alex',
        last_name: 'Accounting',
        role: 'ACCOUNTING',
        is_active: 1
      },
      {
        username: 'worker',
        email: 'worker@example.com',
        password_hash: hashPassword('worker123'),
        first_name: 'Will',
        last_name: 'Worker',
        role: 'WORKER',
        is_active: 1
      }
    ];

    const insertAuthUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
      VALUES (@username, @email, @password_hash, @first_name, @last_name, @role, @is_active)
    `);

    authUsers.forEach(user => insertAuthUser.run(user));
    
    // Accounts einfügen
    const accounts = [
      {
        name: 'Hausverwaltung Schmidt GmbH',
        address: 'Berliner Str. 123, 10115 Berlin',
        phone: '030 12345678',
        email: 'info@hv-schmidt.de',
        website: 'www.hv-schmidt.de',
        tax_number: '123/456/78910',
        notes: 'Großer Kunde mit vielen Hausobjekten in Berlin.'
      },
      {
        name: 'Immobilien Müller & Co.',
        address: 'Hauptstraße 45, 80331 München',
        phone: '089 87654321',
        email: 'kontakt@mueller-immobilien.de',
        website: 'www.mueller-immobilien.de',
        tax_number: '234/567/89101',
        notes: 'Fokus auf Gewerbeimmobilien.'
      },
      {
        name: 'Hausverwaltung Becker',
        address: 'Gartenweg 8, 50667 Köln',
        phone: '0221 9876543',
        email: 'info@becker-hausverwaltung.de',
        website: 'www.becker-hausverwaltung.de',
        tax_number: '345/678/91011',
        notes: 'Familienunternehmen, spezialisiert auf Wohnimmobilien.'
      }
    ];
    
    const insertAccount = db.prepare(`
      INSERT INTO accounts (name, address, phone, email, website, tax_number, notes)
      VALUES (@name, @address, @phone, @email, @website, @tax_number, @notes)
    `);
    
    accounts.forEach(account => {
      insertAccount.run(account);
    });
    
    // Kontakte einfügen
    const contacts = [
      {
        account_id: 1,
        first_name: 'Thomas',
        last_name: 'Schmidt',
        position: 'Geschäftsführer',
        phone: '030 12345678',
        mobile: '0170 1234567',
        email: 't.schmidt@hv-schmidt.de',
        address: 'Berliner Str. 123, 10115 Berlin',
        birthday: '1975-05-15',
        is_primary_contact: 1,
        notes: 'Bevorzugt Kommunikation per E-Mail.'
      },
      {
        account_id: 1,
        first_name: 'Anna',
        last_name: 'Müller',
        position: 'Verwalterin',
        phone: '030 12345679',
        mobile: '0170 1234568',
        email: 'a.mueller@hv-schmidt.de',
        address: 'Berliner Str. 123, 10115 Berlin',
        birthday: '1982-08-23',
        is_primary_contact: 0,
        notes: 'Zuständig für Wohnobjekte in Berlin-Mitte.'
      },
      {
        account_id: 2,
        first_name: 'Julia',
        last_name: 'Fischer',
        position: 'Geschäftsführerin',
        phone: '089 87654321',
        mobile: '0171 9876543',
        email: 'j.fischer@mueller-immobilien.de',
        address: 'Hauptstraße 45, 80331 München',
        birthday: '1978-12-10',
        is_primary_contact: 1,
        notes: 'Bevorzugt telefonischen Kontakt.'
      },
      {
        account_id: 3,
        first_name: 'Peter',
        last_name: 'Becker',
        position: 'Inhaber',
        phone: '0221 9876543',
        mobile: '0172 8765432',
        email: 'p.becker@becker-hausverwaltung.de',
        address: 'Gartenweg 8, 50667 Köln',
        birthday: '1965-03-28',
        is_primary_contact: 1,
        notes: 'Langjährige Erfahrung in der Immobilienbranche.'
      }
    ];
    
    const insertContact = db.prepare(`
      INSERT INTO contacts (account_id, first_name, last_name, position, phone, mobile, email, address, birthday, is_primary_contact, notes)
      VALUES (@account_id, @first_name, @last_name, @position, @phone, @mobile, @email, @address, @birthday, @is_primary_contact, @notes)
    `);
    
    contacts.forEach(contact => {
      insertContact.run(contact);
    });
    
    // Hausobjekte einfügen
    const properties = [
      {
        account_id: 1,
        contact_id: 1,
        name: 'Wohnanlage Mitte',
        address: 'Berliner Str. 123',
        postal_code: '10115',
        city: 'Berlin',
        country: 'Deutschland',
        notes: 'Wohnanlage mit 24 Wohneinheiten, Baujahr 1998, letzte Sanierung 2018.',
        alt_invoice_address: null,
        latitude: 52.5296,
        longitude: 13.4112
      },
      {
        account_id: 1,
        contact_id: 1,
        name: 'Bürogebäude Kreuzberg',
        address: 'Oranienstr. 45',
        postal_code: '10997',
        city: 'Berlin',
        country: 'Deutschland',
        notes: 'Bürogebäude mit 12 Einheiten, Baujahr 2005.',
        alt_invoice_address: null,
        latitude: 52.5005,
        longitude: 13.4241
      },
      {
        account_id: 2,
        contact_id: 3,
        name: 'Wohnkomplex Süd',
        address: 'Hauptstraße 45',
        postal_code: '80331',
        city: 'München',
        country: 'Deutschland',
        notes: 'Wohnkomplex mit 36 Wohneinheiten und Tiefgarage.',
        alt_invoice_address: null,
        latitude: 48.132,
        longitude: 11.5663
      },
      {
        account_id: 3,
        contact_id: 4,
        name: 'Geschäftshaus Zentrum',
        address: 'Gartenweg 8',
        postal_code: '50667',
        city: 'Köln',
        country: 'Deutschland',
        notes: 'Gemischt genutztes Objekt mit Geschäften im EG und Wohnungen in den Obergeschossen.',
        alt_invoice_address: null,
        latitude: 50.9383,
        longitude: 6.9583
      }
    ];

    const insertProperty = db.prepare(`
      INSERT INTO properties (
        account_id,
        name,
        address,
        city,
        postal_code,
        country,
        contact_id,
        notes,
        alt_invoice_address,
        latitude,
        longitude
      )
      VALUES (
        @account_id,
        @name,
        @address,
        @city,
        @postal_code,
        @country,
        @contact_id,
        @notes,
        @alt_invoice_address,
        @latitude,
        @longitude
      )
    `);
    
    properties.forEach(property => {
      insertProperty.run(property);
    });
    
    // Hausobjekt-Kontakt-Verknüpfungen
    const propertyContacts = [
      {
        property_id: 1,
        contact_id: 1,
        role: 'Hauptverantwortlicher'
      },
      {
        property_id: 1,
        contact_id: 2,
        role: 'Ansprechpartnerin'
      },
      {
        property_id: 2,
        contact_id: 1,
        role: 'Hauptverantwortlicher'
      },
      {
        property_id: 3,
        contact_id: 3,
        role: 'Hauptverantwortliche'
      },
      {
        property_id: 4,
        contact_id: 4,
        role: 'Hauptverantwortlicher'
      }
    ];
    
    const insertPropertyContact = db.prepare(`
      INSERT INTO property_contacts (property_id, contact_id, role)
      VALUES (@property_id, @contact_id, @role)
    `);
    
    propertyContacts.forEach(propertyContact => {
      insertPropertyContact.run(propertyContact);
    });

    // Mitarbeitende einfügen
    const employees = [
      {
        first_name: 'Lena',
        last_name: 'Schneider',
        email: 'lena.schneider@werkassist.de',
        phone: '+49 171 1234567',
        role: 'field',
        is_field_worker: 1,
        color: '#F44336'
      },
      {
        first_name: 'Marco',
        last_name: 'Weber',
        email: 'marco.weber@werkassist.de',
        phone: '+49 172 9876543',
        role: 'field',
        is_field_worker: 1,
        color: '#2196F3'
      },
      {
        first_name: 'Sophie',
        last_name: 'Keller',
        email: 'sophie.keller@werkassist.de',
        phone: '+49 30 99887766',
        role: 'backoffice',
        is_field_worker: 0,
        color: '#4CAF50'
      }
    ];

    const insertEmployee = db.prepare(`
      INSERT INTO employees (first_name, last_name, email, phone, role, is_field_worker, color)
      VALUES (@first_name, @last_name, @email, @phone, @role, @is_field_worker, @color)
    `);

    employees.forEach(employee => {
      insertEmployee.run(employee);
    });

    // Materialien einfügen
    const materials = [
      {
        name: 'Edelstahl-Handlauf 2m',
        sku: 'ES-HAND-200',
        unit: 'Stk.',
        stock: 12,
        reorder_level: 5,
        supplier_name: 'Metallgroßhandel Nord',
        supplier_article_number: 'MGN-5512',
        supplier_price: 89.5,
        notes: 'inkl. Schrauben und Dübel'
      },
      {
        name: 'Chemischer Dübel 300ml',
        sku: 'CHEM-DUE-300',
        unit: 'Kartusche',
        stock: 6,
        reorder_level: 4,
        supplier_name: 'BauProfi24',
        supplier_article_number: 'BP-CHD-300',
        supplier_price: 21.9,
        notes: 'Lagerung frostfrei'
      },
      {
        name: 'Schutzlack transparent',
        sku: 'LACK-TR-1L',
        unit: 'Liter',
        stock: 3,
        reorder_level: 3,
        supplier_name: 'Farbenfabrik Süd',
        supplier_article_number: 'FFS-LTR-1',
        supplier_price: 34.5,
        notes: 'Für Außeneinsatz geeignet'
      }
    ];

    const insertMaterial = db.prepare(`
      INSERT INTO materials (name, sku, unit, stock, reorder_level, supplier_name, supplier_article_number, supplier_price, notes)
      VALUES (@name, @sku, @unit, @stock, @reorder_level, @supplier_name, @supplier_article_number, @supplier_price, @notes)
    `);

    materials.forEach(material => {
      insertMaterial.run(material);
    });

    // Serviceaufträge einfügen
    const serviceOrders = [
      {
        title: 'Geländer-Montage Wohnanlage Mitte',
        description: 'Montage eines Edelstahl-Handlaufes im Treppenhaus. Kunden wünscht Fotodokumentation.',
        account_id: 1,
        property_id: 1,
        service_recipient_contact_id: 2,
        invoice_account_id: 1,
        status: 'in_progress',
        priority: 'high',
        planned_date: '2025-04-05',
        planned_start: '2025-04-05T08:00:00',
        planned_end: '2025-04-05T12:00:00',
        actual_start: '2025-04-05T08:05:00',
        actual_end: null,
        estimated_hours: 4,
        google_event_id: null,
        outlook_event_id: null,
        notes: 'Parkplatz hinter dem Gebäude nutzen.',
        created_by: 3
      },
      {
        title: 'Türschließer Austausch Bürogebäude Kreuzberg',
        description: 'Alte Türschließer gegen neue Modelle mit Soft-Close austauschen. Kundenunterschrift vor Ort einholen.',
        account_id: 1,
        property_id: 2,
        service_recipient_contact_id: 1,
        invoice_account_id: 1,
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
        created_by: 3
      },
      {
        title: 'Wartung Brandschutztüren Geschäftshaus Zentrum',
        description: 'Jährliche Wartung inkl. Schmierung und Funktionsprüfung aller Brandschutztüren.',
        account_id: 3,
        property_id: 4,
        service_recipient_contact_id: 4,
        invoice_account_id: 3,
        status: 'completed',
        priority: 'low',
        planned_date: '2025-03-31',
        planned_start: '2025-03-31T07:30:00',
        planned_end: '2025-03-31T12:30:00',
        actual_start: '2025-03-31T07:20:00',
        actual_end: '2025-03-31T12:15:00',
        estimated_hours: 5,
        google_event_id: null,
        outlook_event_id: null,
        notes: 'Brandschutzprotokoll bereits abgelegt.',
        created_by: 3
      }
    ];

    const insertServiceOrder = db.prepare(`
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

    const serviceOrderIds = serviceOrders.map(order => insertServiceOrder.run(order).lastInsertRowid);

    // Einsatzplanung einfügen
    const orderAssignments = [
      {
        order_index: 0,
        employee_id: 1,
        scheduled_date: '2025-04-05',
        scheduled_start: '2025-04-05T08:00:00',
        scheduled_end: '2025-04-05T12:00:00',
        is_primary: 1
      },
      {
        order_index: 0,
        employee_id: 2,
        scheduled_date: '2025-04-05',
        scheduled_start: '2025-04-05T08:00:00',
        scheduled_end: '2025-04-05T12:00:00',
        is_primary: 0
      },
      {
        order_index: 1,
        employee_id: 2,
        scheduled_date: '2025-04-06',
        scheduled_start: '2025-04-06T09:00:00',
        scheduled_end: '2025-04-06T13:00:00',
        is_primary: 1
      },
      {
        order_index: 2,
        employee_id: 1,
        scheduled_date: '2025-03-31',
        scheduled_start: '2025-03-31T07:30:00',
        scheduled_end: '2025-03-31T12:30:00',
        is_primary: 1
      }
    ];

    const insertAssignment = db.prepare(`
      INSERT INTO order_assignments (order_id, employee_id, scheduled_date, scheduled_start, scheduled_end, is_primary)
      VALUES (@order_id, @employee_id, @scheduled_date, @scheduled_start, @scheduled_end, @is_primary)
    `);

    orderAssignments.forEach(assignment => {
      insertAssignment.run({
        order_id: serviceOrderIds[assignment.order_index],
        employee_id: assignment.employee_id,
        scheduled_date: assignment.scheduled_date,
        scheduled_start: assignment.scheduled_start,
        scheduled_end: assignment.scheduled_end,
        is_primary: assignment.is_primary
      });
    });

    // Zeiterfassung einfügen
    const timeEntries = [
      {
        order_index: 0,
        employee_id: 1,
        start_time: '2025-04-05T08:05:00',
        end_time: '2025-04-05T11:45:00',
        duration_minutes: 220,
        source: 'mobile',
        start_lat: 52.5302,
        start_lng: 13.3889,
        end_lat: 52.5302,
        end_lng: 13.3889,
        distance_km: 12.4,
        notes: 'Anfahrt über A100'
      },
      {
        order_index: 0,
        employee_id: 2,
        start_time: '2025-04-05T08:10:00',
        end_time: '2025-04-05T11:30:00',
        duration_minutes: 200,
        source: 'gps',
        start_lat: 52.5303,
        start_lng: 13.3887,
        end_lat: 52.5303,
        end_lng: 13.3887,
        distance_km: 11.8,
        notes: 'Check-in automatisch erfasst'
      },
      {
        order_index: 2,
        employee_id: 1,
        start_time: '2025-03-31T07:25:00',
        end_time: '2025-03-31T12:10:00',
        duration_minutes: 285,
        source: 'mobile',
        start_lat: 50.9390,
        start_lng: 6.9570,
        end_lat: 50.9390,
        end_lng: 6.9570,
        distance_km: 9.2,
        notes: 'Zusätzliche Sicherheitseinweisung durchgeführt'
      }
    ];

    const insertTimeEntry = db.prepare(`
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

    timeEntries.forEach(entry => {
      insertTimeEntry.run({
        order_id: serviceOrderIds[entry.order_index],
        employee_id: entry.employee_id,
        start_time: entry.start_time,
        end_time: entry.end_time,
        duration_minutes: entry.duration_minutes,
        source: entry.source,
        start_lat: entry.start_lat,
        start_lng: entry.start_lng,
        end_lat: entry.end_lat,
        end_lng: entry.end_lng,
        distance_km: entry.distance_km,
        notes: entry.notes
      });
    });

    // Materialverbrauch einfügen
    const materialUsage = [
      {
        order_index: 0,
        employee_id: 1,
        material_id: 1,
        material_name: 'Edelstahl-Handlauf 2m',
        quantity: 2,
        unit: 'Stk.',
        unit_price: 129.0
      },
      {
        order_index: 0,
        employee_id: 2,
        material_id: 2,
        material_name: 'Chemischer Dübel 300ml',
        quantity: 1,
        unit: 'Kartusche',
        unit_price: 24.5
      },
      {
        order_index: 2,
        employee_id: 1,
        material_id: 3,
        material_name: 'Schutzlack transparent',
        quantity: 0.5,
        unit: 'Liter',
        unit_price: 36.0
      }
    ];

    const insertMaterialUsage = db.prepare(`
      INSERT INTO material_usage (order_id, employee_id, material_id, material_name, quantity, unit, unit_price)
      VALUES (@order_id, @employee_id, @material_id, @material_name, @quantity, @unit, @unit_price)
    `);

    materialUsage.forEach(usage => {
      insertMaterialUsage.run({
        order_id: serviceOrderIds[usage.order_index],
        employee_id: usage.employee_id,
        material_id: usage.material_id,
        material_name: usage.material_name,
        quantity: usage.quantity,
        unit: usage.unit,
        unit_price: usage.unit_price
      });
    });

    // Fotodokumentation und Unterschrift einfügen
    const insertPhoto = db.prepare(`
      INSERT INTO order_photos (order_id, employee_id, photo_data, caption)
      VALUES (@order_id, @employee_id, @photo_data, @caption)
    `);

    insertPhoto.run({
      order_id: serviceOrderIds[0],
      employee_id: 1,
      photo_data: 'data:image/png;base64,UE5HUE5H',
      caption: 'Montierter Handlauf im Treppenhaus'
    });

    const insertSignature = db.prepare(`
      INSERT INTO order_signatures (order_id, signed_by, signed_at, signature_data)
      VALUES (@order_id, @signed_by, @signed_at, @signature_data)
    `);

    insertSignature.run({
      order_id: serviceOrderIds[2],
      signed_by: 'Peter Becker',
      signed_at: '2025-03-31T12:20:00',
      signature_data: 'data:image/png;base64,U0lHTg=='
    });

    // Produkte einfügen
    const products = [
      {
        name: 'Wartung Heizungsanlage',
        description: 'Jährliche Wartung der Heizungsanlage inkl. Materialien',
        unit: 'Stück',
        price: 850.00,
        vat_rate: 19.00,
        is_active: 1
      },
      {
        name: 'Reinigung Treppenhäuser',
        description: 'Wöchentliche Reinigung der Treppenhäuser',
        unit: 'Monat',
        price: 350.00,
        vat_rate: 19.00,
        is_active: 1
      },
      {
        name: 'Gartenpflege',
        description: 'Monatliche Gartenpflege inkl. Rasenmähen und Heckenschnitt',
        unit: 'Monat',
        price: 120.00,
        vat_rate: 19.00,
        is_active: 1
      },
      {
        name: 'Reparatur Aufzug',
        description: 'Reparatur und Wartung von Aufzugsanlagen',
        unit: 'Stunde',
        price: 95.00,
        vat_rate: 19.00,
        is_active: 1
      },
      {
        name: 'Hausmeisterservice',
        description: 'Allgemeiner Hausmeisterservice',
        unit: 'Stunde',
        price: 45.00,
        vat_rate: 19.00,
        is_active: 1
      }
    ];
    
    const insertProduct = db.prepare(`
      INSERT INTO products (name, description, unit, price, vat_rate, is_active)
      VALUES (@name, @description, @unit, @price, @vat_rate, @is_active)
    `);
    
    products.forEach(product => {
      insertProduct.run(product);
    });
    
    // Benutzer einfügen
    const users = [
      {
        username: 'admin',
        email: 'admin@crm-argus.de',
        password_hash: '$2a$10$XFE0UQYWjlVTvf5zQR8WQOQgpYN1vXBfpKzHGC0C8L2MRlYT.wy1G', // "admin123"
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: 1
      },
      {
        username: 'user',
        email: 'user@crm-argus.de',
        password_hash: '$2a$10$XFE0UQYWjlVTvf5zQR8WQOQgpYN1vXBfpKzHGC0C8L2MRlYT.wy1G', // "user123"
        first_name: 'Standard',
        last_name: 'User',
        role: 'user',
        is_active: 1
      }
    ];
    
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
      VALUES (@username, @email, @password_hash, @first_name, @last_name, @role, @is_active)
    `);
    
    users.forEach(user => {
      insertUser.run(user);
    });
    
    // Angebote einfügen
    const quotes = [
      {
        account_id: 1,
        property_id: 1,
        contact_id: 1,
        quote_number: 'ANG-2025-001',
        quote_date: '2025-04-01',
        valid_until: '2025-05-01',
        status: 'sent',
        total_net: 850.00,
        total_gross: 1011.50,
        notes: 'Angebot für jährliche Wartung der Heizungsanlage'
      },
      {
        account_id: 2,
        property_id: 3,
        contact_id: 3,
        quote_number: 'ANG-2025-002',
        quote_date: '2025-04-02',
        valid_until: '2025-05-02',
        status: 'created',
        total_net: 350.00,
        total_gross: 416.50,
        notes: 'Angebot für monatliche Reinigung der Treppenhäuser'
      },
      {
        account_id: 3,
        property_id: 4,
        contact_id: 4,
        quote_number: 'ANG-2025-003',
        quote_date: '2025-04-03',
        valid_until: '2025-05-03',
        status: 'accepted',
        total_net: 120.00,
        total_gross: 142.80,
        notes: 'Angebot für monatliche Gartenpflege'
      },
      {
        account_id: 1,
        property_id: 2,
        contact_id: 2,
        quote_number: 'ANG-2025-004',
        quote_date: '2025-04-04',
        valid_until: '2025-05-04',
        status: 'rejected',
        total_net: 95.00,
        total_gross: 113.05,
        notes: 'Angebot für Reparatur des Aufzugs'
      }
    ];
    
    const insertQuote = db.prepare(`
      INSERT INTO quotes (account_id, property_id, contact_id, quote_number, quote_date, valid_until, status, total_net, total_gross, notes)
      VALUES (@account_id, @property_id, @contact_id, @quote_number, @quote_date, @valid_until, @status, @total_net, @total_gross, @notes)
    `);
    
    quotes.forEach(quote => {
      insertQuote.run(quote);
    });
    
    // Angebotspositionen einfügen
    const quoteItems = [
      {
        quote_id: 1,
        product_id: 1,
        description: 'Jährliche Wartung der Heizungsanlage inkl. Materialien',
        quantity: 1,
        unit: 'Stück',
        unit_price: 850.00,
        vat_rate: 19.00,
        total_net: 850.00,
        total_gross: 1011.50,
        position: 1
      },
      {
        quote_id: 2,
        product_id: 2,
        description: 'Wöchentliche Reinigung der Treppenhäuser',
        quantity: 1,
        unit: 'Monat',
        unit_price: 350.00,
        vat_rate: 19.00,
        total_net: 350.00,
        total_gross: 416.50,
        position: 1
      },
      {
        quote_id: 3,
        product_id: 3,
        description: 'Monatliche Gartenpflege inkl. Rasenmähen und Heckenschnitt',
        quantity: 1,
        unit: 'Monat',
        unit_price: 120.00,
        vat_rate: 19.00,
        total_net: 120.00,
        total_gross: 142.80,
        position: 1
      },
      {
        quote_id: 4,
        product_id: 4,
        description: 'Reparatur und Wartung von Aufzugsanlagen',
        quantity: 1,
        unit: 'Stunde',
        unit_price: 95.00,
        vat_rate: 19.00,
        total_net: 95.00,
        total_gross: 113.05,
        position: 1
      }
    ];
    
    const insertQuoteItem = db.prepare(`
      INSERT INTO quote_items (quote_id, product_id, description, quantity, unit, unit_price, vat_rate, total_net, total_gross, position)
      VALUES (@quote_id, @product_id, @description, @quantity, @unit, @unit_price, @vat_rate, @total_net, @total_gross, @position)
    `);
    
    quoteItems.forEach(item => {
      insertQuoteItem.run(item);
    });

    // Rechnungen einfügen
    const invoices = [
      {
        quote_id: 3,
        account_id: 3,
        property_id: 4,
        contact_id: 4,
        invoice_number: 'RE-2025-001',
        invoice_date: '2025-04-02',
        due_date: '2025-04-16',
        status: 'sent',
        total_net: 120.0,
        total_gross: 142.8,
        amount_paid: 0,
        payment_terms: 'Zahlbar innerhalb von 14 Tagen netto',
        notes: 'Wartung Brandschutztüren gemäß Angebot ANG-2025-003'
      }
    ];

    const insertInvoice = db.prepare(`
      INSERT INTO invoices (
        quote_id, account_id, property_id, contact_id, invoice_number,
        invoice_date, due_date, status, total_net, total_gross,
        amount_paid, payment_terms, notes
      )
      VALUES (
        @quote_id, @account_id, @property_id, @contact_id, @invoice_number,
        @invoice_date, @due_date, @status, @total_net, @total_gross,
        @amount_paid, @payment_terms, @notes
      )
    `);

    const invoiceIds = invoices.map(invoice => insertInvoice.run(invoice).lastInsertRowid);

    const invoiceItems = [
      {
        invoice_index: 0,
        quote_item_id: 3,
        product_id: 3,
        description: 'Monatliche Gartenpflege inkl. Rasenmähen und Heckenschnitt',
        quantity: 1,
        unit: 'Monat',
        unit_price: 120.0,
        vat_rate: 19.0,
        total_net: 120.0,
        total_gross: 142.8,
        position: 1
      }
    ];

    const insertInvoiceItem = db.prepare(`
      INSERT INTO invoice_items (
        invoice_id, quote_item_id, product_id, description, quantity,
        unit, unit_price, vat_rate, total_net, total_gross, position
      )
      VALUES (
        @invoice_id, @quote_item_id, @product_id, @description, @quantity,
        @unit, @unit_price, @vat_rate, @total_net, @total_gross, @position
      )
    `);

    invoiceItems.forEach(item => {
      insertInvoiceItem.run({
        invoice_id: invoiceIds[item.invoice_index],
        quote_item_id: item.quote_item_id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        total_net: item.total_net,
        total_gross: item.total_gross,
        position: item.position
      });
    });

    console.log('Testdaten wurden erfolgreich eingefügt!');
  } catch (error) {
    console.error('Fehler beim Einfügen der Testdaten:', error);
    process.exit(1);
  }
}

// Wenn das Skript direkt ausgeführt wird
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
