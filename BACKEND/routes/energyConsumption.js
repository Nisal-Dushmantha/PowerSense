const express = require('express');
const router = express.Router();
const {
    createEnergyConsumption,
    getEnergyConsumption,
    getTotalConsumption,
    updateEnergyConsumption,
    deleteEnergyConsumption
} = require('../controllers/energyConsumptionController');

// @route   POST /api/energy-consumption
// @access  Public
router.post('/', createEnergyConsumption);

// @route   GET /api/energy-consumption
// @access  Public
router.get('/', getEnergyConsumption);

// @route   GET /api/energy-consumption/total
// @access  Public
router.get('/total', getTotalConsumption);

// @route   PUT /api/energy-consumption/:id
// @access  Public
router.put('/:id', updateEnergyConsumption);

// @route   DELETE /api/energy-consumption/:id
// @access  Public
router.delete('/:id', deleteEnergyConsumption);

module.exports = router;
