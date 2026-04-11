const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Device = require('../../models/devices');

describe('Device model unit tests', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterEach(async () => {
    await Device.deleteMany({});
    const Counter = mongoose.models.Counter;
    if (Counter) {
      await Counter.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
  });

  test('auto-generates deviceId in DVC-xxx format', async () => {
    const device = await Device.create({
      user: new mongoose.Types.ObjectId(),
      name: 'Fan',
      type: 'Cooling',
      powerRating: 75,
      expectedDailyUsage: 8,
    });

    expect(device.deviceId).toMatch(/^DVC-\d{3}$/);
  });

  test('calculates virtual fields correctly', async () => {
    const device = await Device.create({
      user: new mongoose.Types.ObjectId(),
      name: 'TV',
      type: 'Entertainment',
      powerRating: 100,
      expectedDailyUsage: 5,
    });

    expect(device.dailyW).toBe(500);
    expect(device.monthlyW).toBe(15000);
    expect(device.dailyKwh).toBe(0.5);
    expect(device.monthlyKwh).toBe(15);
  });

  test('fails validation when required name is missing', async () => {
    const bad = new Device({
      user: new mongoose.Types.ObjectId(),
      type: 'Lighting',
      powerRating: 10,
      expectedDailyUsage: 6,
    });

    await expect(bad.validate()).rejects.toThrow();
  });

  test('fails validation when powerRating is negative', async () => {
    const bad = new Device({
      user: new mongoose.Types.ObjectId(),
      name: 'Bulb',
      type: 'Lighting',
      powerRating: -5,
      expectedDailyUsage: 4,
    });

    await expect(bad.validate()).rejects.toThrow();
  });

  test('fails validation when expectedDailyUsage is negative', async () => {
    const bad = new Device({
      user: new mongoose.Types.ObjectId(),
      name: 'Heater',
      type: 'Heating',
      powerRating: 1200,
      expectedDailyUsage: -1,
    });

    await expect(bad.validate()).rejects.toThrow();
  });
});
