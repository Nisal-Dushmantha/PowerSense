const express = require('express');
const { protect } = require('../middleware/auth');
const {
    getPeakUsage,
    getThresholdAlerts,
    getCarbonFootprint,
    getUsageComparison,
    getRecommendations,
    downloadMonthlyReport
} = require('../controllers/energyAnalyticsController');

const router = express.Router();

// All routes protected
router.use(protect);

router.get('/peak',            getPeakUsage);
router.get('/alerts',          getThresholdAlerts);
router.get('/carbon',          getCarbonFootprint);
router.get('/comparison',      getUsageComparison);
router.get('/recommendations', getRecommendations);
router.get('/report/pdf',      downloadMonthlyReport);

module.exports = router;
