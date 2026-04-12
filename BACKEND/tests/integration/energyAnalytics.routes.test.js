process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../models/energyConsumption', () => ({
  find: jest.fn(),
  aggregate: jest.fn()
}));

jest.mock('../../models/User', () => ({
  findById: jest.fn()
}));

jest.mock('../../services/energyWhatsAppService', () => ({
  start: jest.fn(),
  getStatus: jest.fn(),
  getQrDataUrl: jest.fn(),
  sendMessage: jest.fn()
}));

const app = require('../../app');
const EnergyConsumption = require('../../models/energyConsumption');
const User = require('../../models/User');
const whatsappService = require('../../services/energyWhatsAppService');

describe('Energy analytics routes integration tests', () => {
  let token;

  beforeAll(() => {
    token = jwt.sign({ id: 'user-1' }, process.env.JWT_SECRET, { expiresIn: '1d' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects unauthenticated access to alerts endpoint', async () => {
    const res = await request(app).get('/api/energy-analytics/alerts');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('returns threshold alerts for authenticated user', async () => {
    User.findById.mockResolvedValue({
      _id: 'user-1',
      id: 'user-1',
      isActive: true,
      role: 'user',
      energyThreshold: 100
    });

    EnergyConsumption.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([
          {
            meter_id: 'MTR-001',
            consumption_date: new Date('2026-04-10'),
            energy_used_kwh: 125,
            period_type: 'daily'
          }
        ])
      })
    });

    const res = await request(app)
      .get('/api/energy-analytics/alerts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.threshold).toBe(100);
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.alerts[0]).toEqual(
      expect.objectContaining({
        meter_id: 'MTR-001',
        energy_used_kwh: 125,
        exceeded_by: 25
      })
    );
  });

  test('starts WhatsApp client through analytics route', async () => {
    User.findById.mockResolvedValue({
      _id: 'user-1',
      id: 'user-1',
      isActive: true,
      role: 'user',
      energyThreshold: 100
    });

    whatsappService.start.mockResolvedValue({
      enabled: true,
      initializing: true,
      ready: false,
      qrAvailable: false,
      lastError: null
    });

    const res = await request(app)
      .post('/api/energy-analytics/whatsapp/start')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('WhatsApp client startup triggered');
    expect(whatsappService.start).toHaveBeenCalledTimes(1);
  });

  test('returns WhatsApp status through analytics route', async () => {
    User.findById.mockResolvedValue({
      _id: 'user-1',
      id: 'user-1',
      isActive: true,
      role: 'user',
      energyThreshold: 100
    });

    whatsappService.getStatus.mockReturnValue({
      enabled: true,
      initializing: false,
      ready: true,
      qrAvailable: false,
      lastError: null
    });

    const res = await request(app)
      .get('/api/energy-analytics/whatsapp/status')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        enabled: true,
        ready: true
      })
    );
  });
});
