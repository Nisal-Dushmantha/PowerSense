process.env.NODE_ENV = 'test';

jest.mock('../../models/energyConsumption', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn()
}));

jest.mock('../../models/devices', () => ({
  findOne: jest.fn()
}));

jest.mock('../../models/monthlyBill', () => ({}));
jest.mock('../../models/RenewableEnergyRecord', () => ({}));

jest.mock('../../models/User', () => ({
  findById: jest.fn()
}));

jest.mock('../../services/energyWhatsAppService', () => ({
  isEnabled: jest.fn(),
  getStatus: jest.fn(),
  start: jest.fn(),
  sendMessage: jest.fn()
}));

const EnergyConsumption = require('../../models/energyConsumption');
const controller = require('../../controllers/energyConsumptionController');

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Energy consumption controller unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getEnergyConsumption returns paginated records for authenticated user', async () => {
    const records = [
      { _id: 'r1', meter_id: 'MTR-001', energy_used_kwh: 10 },
      { _id: 'r2', meter_id: 'MTR-002', energy_used_kwh: 20 }
    ];

    EnergyConsumption.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(records)
          })
        })
      })
    });
    EnergyConsumption.countDocuments.mockResolvedValue(2);

    const req = {
      user: { id: 'user-1' },
      query: { page: '1', limit: '2' }
    };
    const res = createMockRes();

    await controller.getEnergyConsumption(req, res);

    expect(EnergyConsumption.find).toHaveBeenCalledWith({ user: 'user-1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        count: 2,
        data: records,
        pagination: expect.objectContaining({
          page: 1,
          limit: 2,
          total: 2,
          totalPages: 1
        })
      })
    );
  });

  test('updateEnergyConsumption returns 404 for record owned by another user', async () => {
    EnergyConsumption.findOne.mockResolvedValue(null);

    const req = {
      params: { id: 'record-1' },
      user: { id: 'user-1' },
      body: { energy_used_kwh: 25 }
    };
    const res = createMockRes();

    await controller.updateEnergyConsumption(req, res);

    expect(EnergyConsumption.findOne).toHaveBeenCalledWith({ _id: 'record-1', user: 'user-1' });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Energy consumption record not found or you do not have permission to update it'
      })
    );
  });

  test('deleteEnergyConsumption deletes only authenticated user record', async () => {
    EnergyConsumption.findOneAndDelete.mockResolvedValue({ _id: 'record-1', user: 'user-1' });

    const req = {
      params: { id: 'record-1' },
      user: { id: 'user-1' }
    };
    const res = createMockRes();

    await controller.deleteEnergyConsumption(req, res);

    expect(EnergyConsumption.findOneAndDelete).toHaveBeenCalledWith({ _id: 'record-1', user: 'user-1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Energy consumption record deleted successfully'
      })
    );
  });
});
