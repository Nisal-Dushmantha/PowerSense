const MonthlyBill = require('../models/MonthlyBill');

// @desc    Create a new monthly bill
// @route   POST /api/bills
// @access  Public
const createBill = async (req, res) => {
  try {
    const { billNumber, billIssueDate, totalKWh, totalPayment, totalPaid } = req.body;

    // Check if bill number already exists
    const existingBill = await MonthlyBill.findOne({ billNumber });
    if (existingBill) {
      return res.status(400).json({ 
        success: false,
        message: 'Bill number already exists' 
      });
    }

    const bill = new MonthlyBill({
      billNumber,
      billIssueDate,
      totalKWh,
      totalPayment,
      totalPaid: totalPaid || 0
    });

    const savedBill = await bill.save();

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: savedBill
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating bill',
      error: error.message
    });
  }
};

// @desc    Get all monthly bills
// @route   GET /api/bills
// @access  Public
const getAllBills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter options
    const filter = {};
    if (req.query.isPaid) {
      filter.isPaid = req.query.isPaid === 'true';
    }
    if (req.query.billNumber) {
      filter.billNumber = new RegExp(req.query.billNumber, 'i');
    }

    const bills = await MonthlyBill.find(filter)
      .sort({ billIssueDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MonthlyBill.countDocuments(filter);

    res.json({
      success: true,
      message: 'Bills retrieved successfully',
      data: {
        bills,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalBills: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving bills',
      error: error.message
    });
  }
};

// @desc    Get a single bill by ID
// @route   GET /api/bills/:id
// @access  Public
const getBillById = async (req, res) => {
  try {
    const bill = await MonthlyBill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      message: 'Bill retrieved successfully',
      data: bill
    });
  } catch (error) {
    console.error('Get bill error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid bill ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving bill',
      error: error.message
    });
  }
};

// @desc    Get a bill by bill number
// @route   GET /api/bills/number/:billNumber
// @access  Public
const getBillByNumber = async (req, res) => {
  try {
    const bill = await MonthlyBill.findOne({ billNumber: req.params.billNumber.toUpperCase() });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      message: 'Bill retrieved successfully',
      data: bill
    });
  } catch (error) {
    console.error('Get bill by number error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving bill',
      error: error.message
    });
  }
};

// @desc    Update a monthly bill
// @route   PUT /api/bills/:id
// @access  Public
const updateBill = async (req, res) => {
  try {
    const { billNumber, billIssueDate, totalKWh, totalPayment, totalPaid } = req.body;

    const bill = await MonthlyBill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Check if bill number is being changed and if it already exists
    if (billNumber && billNumber !== bill.billNumber) {
      const existingBill = await MonthlyBill.findOne({ billNumber });
      if (existingBill) {
        return res.status(400).json({
          success: false,
          message: 'Bill number already exists'
        });
      }
    }

    // Update fields
    if (billNumber) bill.billNumber = billNumber;
    if (billIssueDate) bill.billIssueDate = billIssueDate;
    if (totalKWh !== undefined) bill.totalKWh = totalKWh;
    if (totalPayment !== undefined) bill.totalPayment = totalPayment;
    if (totalPaid !== undefined) bill.totalPaid = totalPaid;

    const updatedBill = await bill.save();

    res.json({
      success: true,
      message: 'Bill updated successfully',
      data: updatedBill
    });
  } catch (error) {
    console.error('Update bill error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid bill ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating bill',
      error: error.message
    });
  }
};

// @desc    Delete a monthly bill
// @route   DELETE /api/bills/:id
// @access  Public
const deleteBill = async (req, res) => {
  try {
    const bill = await MonthlyBill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    await MonthlyBill.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    console.error('Delete bill error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid bill ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting bill',
      error: error.message
    });
  }
};

// @desc    Get bill statistics
// @route   GET /api/bills/stats
// @access  Public
const getBillStats = async (req, res) => {
  try {
    const totalBills = await MonthlyBill.countDocuments();
    const paidBills = await MonthlyBill.countDocuments({ isPaid: true });
    const unpaidBills = await MonthlyBill.countDocuments({ isPaid: false });
    
    const totalKWhConsumption = await MonthlyBill.aggregate([
      { $group: { _id: null, total: { $sum: '$totalKWh' } } }
    ]);
    
    const totalAmountDue = await MonthlyBill.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPayment' } } }
    ]);
    
    const totalAmountPaid = await MonthlyBill.aggregate([
      { $group: { _id: null, total: { $sum: '$totalPaid' } } }
    ]);

    const totalOutstanding = await MonthlyBill.aggregate([
      { $match: { isPaid: false } },
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);

    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        totalBills,
        paidBills,
        unpaidBills,
        totalKWhConsumption: totalKWhConsumption[0]?.total || 0,
        totalAmountDue: totalAmountDue[0]?.total || 0,
        totalAmountPaid: totalAmountPaid[0]?.total || 0,
        totalOutstanding: totalOutstanding[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving statistics',
      error: error.message
    });
  }
};

module.exports = {
  createBill,
  getAllBills,
  getBillById,
  getBillByNumber,
  updateBill,
  deleteBill,
  getBillStats
};
