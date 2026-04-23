const {
  createBill,
  getAllBills,
  getBillById,
  updateBill,
  deleteBill,
  testBillReminder
} = require('../../controllers/monthlyBill');
const MonthlyBill = require('../../models/monthlyBill');
const {
  sendBillCreatedSummary,
  sendBillPaymentReminder
} = require('../../services/whatsappOtpService');

jest.mock('../../models/monthlyBill', () => {
  const model = jest.fn();
  model.findOne = jest.fn();
  model.find = jest.fn();
  model.countDocuments = jest.fn();
  model.findByIdAndDelete = jest.fn();
  return model;
});

jest.mock('../../services/whatsappOtpService', () => ({
  sendBillCreatedSummary: jest.fn(),
  sendBillPaymentReminder: jest.fn()
}));

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const USER_ID = '507f1f77bcf86cd799439011';

describe('Monthly Bill Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBill', () => {
    test('returns 400 when bill issue date is in the future', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const req = {
        user: { id: USER_ID },
        body: {
          billNumber: 'B1001',
          billIssueDate: tomorrow,
          totalKWh: 150,
          totalPayment: 4000,
          totalPaid: 2000
        }
      };
      const res = makeRes();

      await createBill(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Bill issue date cannot be a future date'
        })
      );
      expect(MonthlyBill.findOne).not.toHaveBeenCalled();
    });

    test('returns 400 when bill number already exists for same user', async () => {
      MonthlyBill.findOne.mockResolvedValue({ _id: 'existingBillId' });
      const req = {
        user: { id: USER_ID },
        body: {
          billNumber: 'B1001',
          billIssueDate: '2026-04-01',
          totalKWh: 100,
          totalPayment: 3000,
          totalPaid: 1000
        }
      };
      const res = makeRes();

      await createBill(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Bill number already exists'
        })
      );
    });

    test('returns 201 when bill is created successfully', async () => {
      MonthlyBill.findOne.mockResolvedValue(null);
      const savedBill = {
        _id: 'billId1',
        billNumber: 'B2001',
        billIssueDate: new Date('2026-04-01'),
        totalKWh: 120,
        totalPayment: 3500,
        totalPaid: 1500
      };
      const save = jest.fn().mockResolvedValue(savedBill);
      MonthlyBill.mockImplementation(() => ({ save }));
      sendBillCreatedSummary.mockResolvedValue({ success: true });

      const req = {
        user: { id: USER_ID, phoneNumber: '94770000000' },
        body: {
          billNumber: 'B2001',
          billIssueDate: '2026-04-01',
          totalKWh: 120,
          totalPayment: 3500,
          totalPaid: 1500
        }
      };
      const res = makeRes();

      await createBill(req, res);

      expect(MonthlyBill).toHaveBeenCalledWith(
        expect.objectContaining({
          user: USER_ID,
          billNumber: 'B2001'
        })
      );
      expect(save).toHaveBeenCalledTimes(1);
      expect(sendBillCreatedSummary).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Bill created successfully',
          data: savedBill
        })
      );
    });
  });

  describe('getAllBills', () => {
    test('returns paginated bills with filters', async () => {
      const bills = [{ billNumber: 'B1111' }];
      const limit = jest.fn().mockResolvedValue(bills);
      const skip = jest.fn().mockReturnValue({ limit });
      const sort = jest.fn().mockReturnValue({ skip, limit });

      MonthlyBill.find.mockReturnValue({ sort });
      MonthlyBill.countDocuments.mockResolvedValue(1);

      const req = {
        user: { id: USER_ID },
        query: {
          page: '1',
          limit: '5',
          isPaid: 'true',
          billNumber: 'B11'
        }
      };
      const res = makeRes();

      await getAllBills(req, res);

      expect(MonthlyBill.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isPaid: true,
          billNumber: expect.any(RegExp)
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Bills retrieved successfully',
          data: expect.objectContaining({
            bills,
            pagination: expect.objectContaining({
              currentPage: 1,
              totalPages: 1,
              totalBills: 1
            })
          })
        })
      );
    });
  });

  describe('getBillById', () => {
    test('returns 404 when bill is not found', async () => {
      MonthlyBill.findOne.mockResolvedValue(null);
      const req = { user: { id: USER_ID }, params: { id: '507f1f77bcf86cd799439012' } };
      const res = makeRes();

      await getBillById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Bill not found'
        })
      );
    });

    test('returns 400 when id format is invalid', async () => {
      MonthlyBill.findOne.mockRejectedValue({ name: 'CastError' });
      const req = { user: { id: USER_ID }, params: { id: 'invalid-id' } };
      const res = makeRes();

      await getBillById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid bill ID'
        })
      );
    });
  });

  describe('updateBill', () => {
    test('returns 400 when changing bill number to an existing one', async () => {
      const existingBill = {
        billNumber: 'OLD100',
        save: jest.fn()
      };
      MonthlyBill.findOne
        .mockResolvedValueOnce(existingBill)
        .mockResolvedValueOnce({ _id: 'duplicateBill' });

      const req = {
        user: { id: USER_ID },
        params: { id: '507f1f77bcf86cd799439013' },
        body: { billNumber: 'NEW100' }
      };
      const res = makeRes();

      await updateBill(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Bill number already exists'
        })
      );
      expect(existingBill.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteBill', () => {
    test('deletes existing bill successfully', async () => {
      MonthlyBill.findOne.mockResolvedValue({ _id: '507f1f77bcf86cd799439014' });
      MonthlyBill.findByIdAndDelete.mockResolvedValue({});

      const req = { user: { id: USER_ID }, params: { id: '507f1f77bcf86cd799439014' } };
      const res = makeRes();

      await deleteBill(req, res);

      expect(MonthlyBill.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439014');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Bill deleted successfully'
        })
      );
    });
  });

  describe('testBillReminder', () => {
    test('returns 404 when no eligible bill exists', async () => {
      const sort = jest.fn().mockResolvedValue(null);
      MonthlyBill.findOne.mockReturnValue({ sort });

      const req = { user: { id: USER_ID }, body: {} };
      const res = makeRes();

      await testBillReminder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'No eligible bill found to test reminder'
        })
      );
    });

    test('returns success when reminder is sent', async () => {
      const bill = { _id: 'bill1', billNumber: 'B9001' };
      const sort = jest.fn().mockResolvedValue(bill);
      MonthlyBill.findOne.mockReturnValue({ sort });
      sendBillPaymentReminder.mockResolvedValue({ success: true });

      const req = {
        user: { id: USER_ID, phoneNumber: '94770000000' },
        body: {}
      };
      const res = makeRes();

      await testBillReminder(req, res);

      expect(sendBillPaymentReminder).toHaveBeenCalledWith(
        req.user,
        bill,
        { isTest: true }
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Test reminder sent successfully'
        })
      );
    });
  });
});
