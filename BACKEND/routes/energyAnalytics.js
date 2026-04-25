// Energy Analytics Route Layer
// Exposes analytical insights, reports, and WhatsApp actions for energy monitoring.
const express = require('express');
const { protect } = require('../middleware/auth');
const {
    getPeakUsage,
    getThresholdAlerts,
    getCarbonFootprint,
    getUsageComparison,
    getRecommendations,
    downloadMonthlyReport,
    startWhatsAppClient,
    getWhatsAppStatus,
    getWhatsAppQr,
    sendWhatsAppEnergySummary,
    sendWhatsAppThresholdAlerts
} = require('../controllers/energyAnalyticsController');

const router = express.Router();

// Apply JWT protection to every analytics endpoint.
router.use(protect);

router.get('/peak',            getPeakUsage);
router.get('/alerts',          getThresholdAlerts);
router.get('/carbon',          getCarbonFootprint);
router.get('/comparison',      getUsageComparison);
router.get('/recommendations', getRecommendations);
router.get('/report/pdf',      downloadMonthlyReport);
router.post('/whatsapp/start', startWhatsAppClient);
router.get('/whatsapp/status', getWhatsAppStatus);
router.get('/whatsapp/qr', getWhatsAppQr);
router.post('/whatsapp/send-summary', sendWhatsAppEnergySummary);
router.post('/whatsapp/send-threshold-alerts', sendWhatsAppThresholdAlerts);

module.exports = router;
