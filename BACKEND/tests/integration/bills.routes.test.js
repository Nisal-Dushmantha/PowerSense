process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.WHATSAPP_BILL_NOTIFICATIONS_ENABLED = 'false';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../app');
const User = require('../../models/User');
const MonthlyBill = require('../../models/monthlyBill');

let mongoServer;

const createUserAndToken = async (emailPrefix = 'user') => {
  const user = await User.create({
    firstName: 'Test',
    lastName: 'User',
    email: `${emailPrefix}-${Date.now()}@example.com`,
    contactNumber: '+94771234567',
    password: 'password123',
    phoneNumber: '94771234567',
    role: 'user',
    isActive: true
  });

  const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET);
  return { user, token };
};

describe('Bills Management Integration Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterEach(async () => {
    await MonthlyBill.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  test('GET /api/bills should reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/bills');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/bills creates a bill and GET /api/bills returns it', async () => {
    const { token } = await createUserAndToken('creator');

    const createRes = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        billNumber: 'B-INT-001',
        billIssueDate: '2026-04-01',
        totalKWh: 180,
        totalPayment: 5400,
        totalPaid: 1000
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.billNumber).toBe('B-INT-001');

    const listRes = await request(app)
      .get('/api/bills')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.bills).toHaveLength(1);
    expect(listRes.body.data.bills[0].billNumber).toBe('B-INT-001');
  });

  test('GET /api/bills/:id only allows bill owner access', async () => {
    const owner = await createUserAndToken('owner');
    const anotherUser = await createUserAndToken('other');

    const bill = await MonthlyBill.create({
      user: owner.user._id,
      billNumber: 'B-SEC-001',
      billIssueDate: new Date('2026-03-10'),
      totalKWh: 110,
      totalPayment: 3200,
      totalPaid: 500
    });

    const ownerRes = await request(app)
      .get(`/api/bills/${bill._id.toString()}`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.success).toBe(true);

    const otherRes = await request(app)
      .get(`/api/bills/${bill._id.toString()}`)
      .set('Authorization', `Bearer ${anotherUser.token}`);

    expect(otherRes.status).toBe(404);
    expect(otherRes.body.success).toBe(false);
  });

  test('POST /api/bills rejects future bill issue date', async () => {
    const { token } = await createUserAndToken('future');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({
        billNumber: 'B-FUTURE-1',
        billIssueDate: tomorrow,
        totalKWh: 200,
        totalPayment: 8000,
        totalPaid: 0
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Bill issue date cannot be a future date');
  });

  test('GET /api/bills/:id returns 400 for invalid bill id format', async () => {
    const { token } = await createUserAndToken('invalidid');

    const res = await request(app)
      .get('/api/bills/not-a-valid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid bill ID');
  });

  test('PUT then DELETE bill flow works end-to-end', async () => {
    const { user, token } = await createUserAndToken('update');

    const created = await MonthlyBill.create({
      user: user._id,
      billNumber: 'B-UPD-001',
      billIssueDate: new Date('2026-03-01'),
      totalKWh: 145,
      totalPayment: 5000,
      totalPaid: 1000
    });

    const updateRes = await request(app)
      .put(`/api/bills/${created._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ totalPaid: 5000 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.isPaid).toBe(true);
    expect(updateRes.body.data.balance).toBe(0);

    const deleteRes = await request(app)
      .delete(`/api/bills/${created._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const fetchAfterDelete = await request(app)
      .get(`/api/bills/${created._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(fetchAfterDelete.status).toBe(404);
  });
});
