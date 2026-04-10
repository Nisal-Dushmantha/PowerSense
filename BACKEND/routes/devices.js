const express = require('express');
const router = express.Router();
const devicesController = require('../controllers/devices');
const { protect } = require('../middleware/auth');

router.use(protect);

// POST /api/devices  - create a device
router.post('/', devicesController.createDevice);

// GET /api/devices - list all devices
router.get('/', devicesController.getDevices);

// GET /api/devices/export/pdf - download PDF report
router.get('/export/pdf', devicesController.generateDevicesPDFReport);

// GET /api/devices/:deviceId - get single device
router.get('/:deviceId', devicesController.getDeviceById);

// PUT /api/devices/:deviceId - update device
router.put('/:deviceId', devicesController.updateDevice);

// DELETE /api/devices/:deviceId - delete device
router.delete('/:deviceId', devicesController.deleteDevice);

module.exports = router;
