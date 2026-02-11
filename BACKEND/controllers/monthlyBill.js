const MonthlyBill = require('../models/monthlyBill');
const mongoose = require('mongoose');

// @desc    Create a new monthly bill
// @route   POST /api/bills
// @access  Private
const createBill = async (req, res) => {
  try {
    const { billNumber, billIssueDate, totalKWh, totalPayment, totalPaid } = req.body;

    // Check if bill number already exists for this user
    const existingBill = await MonthlyBill.findOne({ 
      user: new mongoose.Types.ObjectId(req.user.id),
      billNumber 
    });
    if (existingBill) {
      return res.status(400).json({ 
        success: false,
        message: 'Bill number already exists' 
      });
    }

    const bill = new MonthlyBill({
      user: req.user.id,
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
// @access  Private
const getAllBills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter options - only show bills for authenticated user
    // Convert user ID to ObjectId and ensure user field exists and matches
    const filter = { 
      user: new mongoose.Types.ObjectId(req.user.id)
    };
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
// @access  Private
const getBillById = async (req, res) => {
  try {
    const bill = await MonthlyBill.findOne({ 
      _id: req.params.id,
      user: new mongoose.Types.ObjectId(req.user.id)
    });

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
// @access  Private
const getBillByNumber = async (req, res) => {
  try {
    const bill = await MonthlyBill.findOne({ 
      billNumber: req.params.billNumber.toUpperCase(),
      user: new mongoose.Types.ObjectId(req.user.id)
    });

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
// @access  Private
const updateBill = async (req, res) => {
  try {
    const { billNumber, billIssueDate, totalKWh, totalPayment, totalPaid } = req.body;

    const bill = await MonthlyBill.findOne({ 
      _id: req.params.id,
      user: new mongoose.Types.ObjectId(req.user.id)
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Check if bill number is being changed and if it already exists for this user
    if (billNumber && billNumber !== bill.billNumber) {
      const existingBill = await MonthlyBill.findOne({ 
        billNumber,
        user: new mongoose.Types.ObjectId(req.user.id)
      });
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
// @access  Private
const deleteBill = async (req, res) => {
  try {
    const bill = await MonthlyBill.findOne({ 
      _id: req.params.id,
      user: new mongoose.Types.ObjectId(req.user.id)
    });

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

module.exports = {
  createBill,
  getAllBills,
  getBillById,
  getBillByNumber,
  updateBill,
  deleteBill
};
