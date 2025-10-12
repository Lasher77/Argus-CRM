const request = require('supertest');
const app = require('../src/app');

const authenticate = async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });

  return response.body.data.accessToken;
};

describe('Invoice batch retrieval', () => {
  let token;

  beforeEach(async () => {
    token = await authenticate();
  });

  test('returns invoices for the requested identifiers', async () => {
    const createResponse = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        account_id: 1,
        property_id: 1,
        contact_id: 1,
        invoice_date: '2025-05-01',
        due_date: '2025-05-15',
        total_net: 250,
        total_gross: 297.5,
        notes: 'Automatisierte Sammelrechnung'
      });

    expect(createResponse.status).toBe(201);
    const createdInvoiceId = createResponse.body.data.invoice_id;

    const batchResponse = await request(app)
      .post('/api/invoices/batch')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [1, createdInvoiceId] });

    expect(batchResponse.status).toBe(200);
    expect(batchResponse.body.success).toBe(true);
    expect(batchResponse.body.data).toHaveLength(2);
    const returnedIds = batchResponse.body.data.map((invoice) => invoice.invoice_id).sort();
    expect(returnedIds).toEqual([1, createdInvoiceId].sort());
  });
});
