process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../app');
const User = require('../../models/User');
const Device = require('../../models/devices');

describe('Device routes integration tests', () => {
  let mongo;
  let user1;
  let user2;
  let token1;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());

    user1 = await User.create({
      firstName: 'Test',
      lastName: 'User1',
      email: 'u1@test.com',
      contactNumber: '+94770000001',
      password: '123456',
      role: 'user',
    });

    user2 = await User.create({
      firstName: 'Test',
      lastName: 'User2',
      email: 'u2@test.com',
      contactNumber: '+94770000002',
      password: '123456',
      role: 'user',
    });

    token1 = jwt.sign({ id: user1._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  });

  afterEach(async () => {
    await Device.deleteMany({});
    const Counter = mongoose.models.Counter;
    if (Counter) {
      await Counter.deleteMany({});
    }
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  });

  test('rejects unauthenticated device list request', async () => {
    const res = await request(app).get('/api/devices');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('creates a device for authenticated user', async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'Fan',
        type: 'Cooling',
        powerRating: 75,
        expectedDailyUsage: 8,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deviceId).toMatch(/^DVC-\d{3}$/);
    expect(res.body.data.name).toBe('Fan');
    expect(String(res.body.data.user)).toBe(String(user1._id));
  });

  test('returns only authenticated user devices', async () => {
    await Device.create({
      user: user1._id,
      name: 'TV',
      type: 'Entertainment',
      powerRating: 100,
      expectedDailyUsage: 5,
    });

    await Device.create({
      user: user2._id,
      name: 'Heater',
      type: 'Heating',
      powerRating: 1200,
      expectedDailyUsage: 2,
    });

    const res = await request(app)
      .get('/api/devices')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('TV');
    expect(String(res.body[0].user)).toBe(String(user1._id));
  });

  test('gets, updates and deletes own device', async () => {
    const created = await Device.create({
      user: user1._id,
      name: 'Laptop',
      type: 'Computing',
      powerRating: 65,
      expectedDailyUsage: 6,
    });

    const getRes = await request(app)
      .get(`/api/devices/${created.deviceId}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe('Laptop');

    const updateRes = await request(app)
      .put(`/api/devices/${created.deviceId}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({
        name: 'Gaming Laptop',
        type: 'Computing',
        powerRating: 120,
        expectedDailyUsage: 4,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Gaming Laptop');
    expect(updateRes.body.dailyW).toBe(480);

    const deleteRes = await request(app)
      .delete(`/api/devices/${created.deviceId}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });

  test('does not allow accessing another users device', async () => {
    const otherUserDevice = await Device.create({
      user: user2._id,
      name: 'Private Device',
      type: 'Other',
      powerRating: 50,
      expectedDailyUsage: 3,
    });

    const res = await request(app)
      .get(`/api/devices/${otherUserDevice.deviceId}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Device not found');
  });
});
