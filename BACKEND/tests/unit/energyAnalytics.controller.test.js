process.env.NODE_ENV = 'test';

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

const EnergyConsumption = require('../../models/energyConsumption');
const User = require('../../models/User');
const whatsappService = require('../../services/energyWhatsAppService');
const controller = require('../../controllers/energyAnalyticsController');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Energy analytics controller unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getThresholdAlerts returns no-threshold response when user threshold is not set', async () => {
    User.findById.mockResolvedValue({ energyThreshold: null });

    const req = { user: { id: 'user-1' } };
    const res = createMockRes();

    await controller.getThresholdAlerts(req, res);

    expect(User.findById).toHaveBeenCalledWith('user-1');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          threshold: null,
          alerts: [],
          count: 0
        })
      })
    );
  });

  test('sendWhatsAppThresholdAlerts returns 400 when threshold is missing', async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        firstName: 'Shali',
        lastName: 'User',
        energyThreshold: null,
        contactNumber: '94770000000'
      })
    });

    const req = { user: { id: 'user-1' }, body: {} };
    const res = createMockRes();

    await controller.sendWhatsAppThresholdAlerts(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Energy threshold is not configured for this user'
      })
    );
  });

  test('sendWhatsAppThresholdAlerts sends WhatsApp message when threshold and contact are available', async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        firstName: 'Shali',
        lastName: 'User',
        energyThreshold: 100,
        contactNumber: '94770000000'
      })
    });

    EnergyConsumption.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([
            {
              meter_id: 'MTR-001',
              consumption_date: new Date('2026-04-10'),
              energy_used_kwh: 120
            }
          ])
        })
      })
    });

    whatsappService.sendMessage.mockResolvedValue({ id: 'msg-1', to: '94770000000' });

    const req = { user: { id: 'user-1' }, body: {} };
    const res = createMockRes();

    await controller.sendWhatsAppThresholdAlerts(req, res);

    expect(whatsappService.sendMessage).toHaveBeenCalledTimes(1);
    expect(whatsappService.sendMessage).toHaveBeenCalledWith(
      '94770000000',
      expect.stringContaining('PowerSense Threshold Alert')
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Threshold alert message sent to WhatsApp'
      })
    );
  });
});
