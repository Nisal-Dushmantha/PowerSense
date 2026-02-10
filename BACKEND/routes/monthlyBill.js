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
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes - require authentication
router.use(protect);

// @route   GET /api/bills/stats
// @desc    Get bill statistics
// @access  Private
router.get('/stats', getBillStats);

// @route   GET /api/bills/number/:billNumber
// @desc    Get bill by bill number
// @access  Private
router.get('/number/:billNumber', getBillByNumber);

// @route   GET /api/bills
// @desc    Get all bills with pagination and filtering
// @access  Private
router.get('/', getAllBills);

// @route   GET /api/bills/:id
// @desc    Get a single bill by ID
// @access  Private
router.get('/:id', getBillById);

// @route   POST /api/bills
// @desc    Create a new bill
// @access  Private
router.post('/', createBill);

// @route   PUT /api/bills/:id
// @desc    Update a bill
// @access  Private
router.put('/:id', updateBill);

// @route   DELETE /api/bills/:id
// @desc    Delete a bill
// @access  Private
router.delete('/:id', deleteBill);

module.exports = router;
