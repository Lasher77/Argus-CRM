const placeholderCatalog = [
  {
    group: 'Firma',
    description: 'Unternehmensinformationen',
    items: [
      { token: '{{company.name}}', label: 'Firmenname' },
      { token: '{{company.address}}', label: 'Adresse' },
      { token: '{{company.phone}}', label: 'Telefon' },
      { token: '{{company.email}}', label: 'E-Mail' },
      { token: '{{company.website}}', label: 'Website' }
    ]
  },
  {
    group: 'Kunde',
    description: 'Empfängerdaten',
    items: [
      { token: '{{customer.name}}', label: 'Name' },
      { token: '{{customer.address}}', label: 'Adresse' },
      { token: '{{customer.contact}}', label: 'Ansprechpartner' }
    ]
  },
  {
    group: 'Angebot',
    description: 'Informationen zu Angeboten',
    items: [
      { token: '{{offer.number}}', label: 'Angebotsnummer' },
      { token: '{{offer.date}}', label: 'Datum' },
      { token: '{{offer.validUntil}}', label: 'Gültig bis' },
      { token: '{{offer.total}}', label: 'Gesamtsumme' }
    ]
  },
  {
    group: 'Rechnung',
    description: 'Informationen zu Rechnungen',
    items: [
      { token: '{{invoice.number}}', label: 'Rechnungsnummer' },
      { token: '{{invoice.date}}', label: 'Rechnungsdatum' },
      { token: '{{invoice.dueDate}}', label: 'Fälligkeitsdatum' },
      { token: '{{invoice.subtotal}}', label: 'Zwischensumme' },
      { token: '{{invoice.vat}}', label: 'MwSt.' },
      { token: '{{invoice.total}}', label: 'Gesamt' }
    ]
  },
  {
    group: 'System',
    description: 'Dynamische Werte',
    items: [
      { token: '{{today}}', label: 'Heutiges Datum (ISO)' },
      { token: '{{date today "DD.MM.YYYY"}}', label: 'Heutiges Datum formatiert' },
      { token: '{{page}}', label: 'Aktuelle Seite' },
      { token: '{{totalPages}}', label: 'Seitenanzahl' }
    ]
  }
];

module.exports = {
  placeholderCatalog
};
