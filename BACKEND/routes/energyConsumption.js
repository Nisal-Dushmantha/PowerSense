const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getEnergyRecords,
  createEnergyRecord,
  updateEnergyRecord,
  deleteEnergyRecord,
  getTotalConsumption
} = require('../controllers/energyConsumptionController');

const router = express.Router();

router.use(protect);

router.get('/', getEnergyRecords);
router.post('/', createEnergyRecord);
router.get('/total', getTotalConsumption);
router.put('/:id', updateEnergyRecord);
router.delete('/:id', deleteEnergyRecord);

module.exports = router;
