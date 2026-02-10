const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  // Source controllers
  createSource,
  getSources,
  getSourceById,
  updateSource,
  deleteSource,
  
  // Record controllers
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  
  // Statistics controllers
  getStatistics,
  getDashboardSummary
} = require('../controllers/renewableController');

// ============ RENEWABLE SOURCE ROUTES ============

// @route   POST /api/renewable/sources
// @desc    Create a new renewable source
// @access  Private
router.post('/sources', protect, createSource);

// @route   GET /api/renewable/sources
// @desc    Get all renewable sources for logged in user
// @access  Private
router.get('/sources', protect, getSources);

// @route   GET /api/renewable/sources/:id
// @desc    Get single renewable source by ID
// @access  Private
router.get('/sources/:id', protect, getSourceById);

// @route   PUT /api/renewable/sources/:id
// @desc    Update renewable source
// @access  Private
router.put('/sources/:id', protect, updateSource);

// @route   DELETE /api/renewable/sources/:id
// @desc    Delete renewable source
// @access  Private
router.delete('/sources/:id', protect, deleteSource);

// ============ ENERGY RECORD ROUTES ============

// @route   POST /api/renewable/records
// @desc    Create a new energy record
// @access  Private
router.post('/records', protect, createRecord);

// @route   GET /api/renewable/records
// @desc    Get all energy records for logged in user
// @access  Private
router.get('/records', protect, getRecords);

// @route   GET /api/renewable/records/:id
// @desc    Get single energy record by ID
// @access  Private
router.get('/records/:id', protect, getRecordById);

// @route   PUT /api/renewable/records/:id
// @desc    Update energy record
// @access  Private
router.put('/records/:id', protect, updateRecord);

// @route   DELETE /api/renewable/records/:id
// @desc    Delete energy record
// @access  Private
router.delete('/records/:id', protect, deleteRecord);

// ============ STATISTICS ROUTES ============

// @route   GET /api/renewable/stats
// @desc    Get renewable energy statistics
// @access  Private
router.get('/stats', protect, getStatistics);

// @route   GET /api/renewable/dashboard
// @desc    Get dashboard summary
// @access  Private
router.get('/dashboard', protect, getDashboardSummary);

module.exports = router;
