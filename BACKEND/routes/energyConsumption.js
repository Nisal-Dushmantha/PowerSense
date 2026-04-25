// Energy Consumption Route Layer
// This router maps authenticated CRUD and summary endpoints to controller actions.
const express = require('express');
const router = express.Router();
const {
    createEnergyConsumption,
    getEnergyConsumption,
    getTotalConsumption,
    getConsumptionSummary,
    getConsumptionIntegration,
    updateEnergyConsumption,
    deleteEnergyConsumption
} = require('../controllers/energyConsumptionController');
const { protect } = require('../middleware/auth');

// Apply JWT protection to all consumption endpoints.
router.use(protect);

// @route   POST /api/energy-consumption
// @access  Private
router.post('/', createEnergyConsumption);

// @route   GET /api/energy-consumption
// @access  Private
router.get('/', getEnergyConsumption);

// @route   GET /api/energy-consumption/total
// @access  Private
router.get('/total', getTotalConsumption);

// @route   GET /api/energy-consumption/summary
// @access  Private
router.get('/summary', getConsumptionSummary);

// @route   GET /api/energy-consumption/integration
// @access  Private
router.get('/integration', getConsumptionIntegration);

// @route   PUT /api/energy-consumption/:id
// @access  Private
router.put('/:id', updateEnergyConsumption);

// @route   DELETE /api/energy-consumption/:id
// @access  Private
router.delete('/:id', deleteEnergyConsumption);

module.exports = router;
