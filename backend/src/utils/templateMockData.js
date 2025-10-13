const dayjs = require('dayjs');

const buildMockItems = () => [
  {
    description: 'Vor-Ort-Service & Wartung',
    title: 'Serviceeinsatz',
    quantity: 3,
    unit: 'Std.',
    unitPrice: 89.5,
    total: 268.5
  },
  {
    description: 'Materialkosten laut Liste',
    title: 'Materialpaket',
    quantity: 1,
    unit: 'Stk.',
    unitPrice: 149.9,
    total: 149.9
  }
];

const buildMockData = () => {
  const today = dayjs();
  const items = buildMockItems();
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const vat = subtotal * 0.19;
  const total = subtotal + vat;

  return {
    today: today.format('YYYY-MM-DD'),
    company: {
      name: 'Argus Facility Services GmbH',
      address: 'Musterstraße 12 · 12345 Berlin',
      phone: '+49 30 1234567',
      email: 'kontakt@argus.de',
      website: 'https://www.argus.de'
    },
    customer: {
      name: 'Muster Immobilienverwaltung KG',
      address: 'Prenzlauer Allee 34 · 10405 Berlin',
      contact: 'Frau Petra Muster'
    },
    offer: {
      number: 'ANG-2024-0156',
      date: today.subtract(2, 'day').format('YYYY-MM-DD'),
      validUntil: today.add(14, 'day').format('YYYY-MM-DD'),
      total,
      items
    },
    invoice: {
      number: 'RE-2024-0831',
      date: today.format('YYYY-MM-DD'),
      dueDate: today.add(14, 'day').format('YYYY-MM-DD'),
      subtotal,
      vat,
      total,
      items: items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: item.total
      }))
    }
  };
};

module.exports = {
  buildMockData
};
