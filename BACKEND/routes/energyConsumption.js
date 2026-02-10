const express = require('express');
const router = express.Router();
const {
    createEnergyConsumption,
    getEnergyConsumption,
    getTotalConsumption,
    updateEnergyConsumption,
    deleteEnergyConsumption
} = require('../controllers/energyConsumptionController');
const { protect } = require('../middleware/auth');

// Protect all routes - require authentication
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

// @route   PUT /api/energy-consumption/:id
// @access  Private
router.put('/:id', updateEnergyConsumption);

// @route   DELETE /api/energy-consumption/:id
// @access  Private
router.delete('/:id', deleteEnergyConsumption);

module.exports = router;
