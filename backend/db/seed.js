// db/seed.js
const db = require('./database');
const initDatabase = require('./init.js');

// Funktion zum Einfügen von Testdaten
function seedDatabase() {
  try {
    // Datenbank zurücksetzen und neu initialisieren
    initDatabase(true);
    
    console.log('Füge Testdaten ein...');
    
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
        name: 'Wohnanlage Mitte',
        street: 'Berliner Str.',
        house_number: '123',
        postal_code: '10115',
        city: 'Berlin',
        notes: 'Wohnanlage mit 24 Wohneinheiten, Baujahr 1998, letzte Sanierung 2018.'
      },
      {
        account_id: 1,
        name: 'Bürogebäude Kreuzberg',
        street: 'Oranienstr.',
        house_number: '45',
        postal_code: '10997',
        city: 'Berlin',
        notes: 'Bürogebäude mit 12 Einheiten, Baujahr 2005.'
      },
      {
        account_id: 2,
        name: 'Wohnkomplex Süd',
        street: 'Hauptstraße',
        house_number: '45',
        postal_code: '80331',
        city: 'München',
        notes: 'Wohnkomplex mit 36 Wohneinheiten und Tiefgarage.'
      },
      {
        account_id: 3,
        name: 'Geschäftshaus Zentrum',
        street: 'Gartenweg',
        house_number: '8',
        postal_code: '50667',
        city: 'Köln',
        notes: 'Gemischt genutztes Objekt mit Geschäften im EG und Wohnungen in den Obergeschossen.'
      }
    ];
    
    const insertProperty = db.prepare(`
      INSERT INTO properties (account_id, name, street, house_number, postal_code, city, notes)
      VALUES (@account_id, @name, @street, @house_number, @postal_code, @city, @notes)
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
