const express = require('express');
const {
  createBill,
  getAllBills,
  getBillById,
  getBillByNumber,
  updateBill,
  deleteBill,
  getBillStats
} = require('../controllers/monthlyBill');

const router = express.Router();

// @route   GET /api/bills/stats
// @desc    Get bill statistics
// @access  Public
router.get('/stats', getBillStats);

// @route   GET /api/bills/number/:billNumber
// @desc    Get bill by bill number
// @access  Public
router.get('/number/:billNumber', getBillByNumber);

// @route   GET /api/bills
// @desc    Get all bills with pagination and filtering
// @access  Public
router.get('/', getAllBills);

// @route   GET /api/bills/:id
// @desc    Get a single bill by ID
// @access  Public
router.get('/:id', getBillById);

// @route   POST /api/bills
// @desc    Create a new bill
// @access  Public
router.post('/', createBill);

// @route   PUT /api/bills/:id
// @desc    Update a bill
// @access  Public
router.put('/:id', updateBill);

// @route   DELETE /api/bills/:id
// @desc    Delete a bill
// @access  Public
router.delete('/:id', deleteBill);

module.exports = router;
