const express = require('express');
const {
  getNotificationWhatsAppStatus,
  getNotificationWhatsAppQr,
  getNotificationWhatsAppQrView,
  sendNotificationWhatsAppTest
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/whatsapp/status', getNotificationWhatsAppStatus);
router.get('/whatsapp/qr', getNotificationWhatsAppQr);
router.get('/whatsapp/qr-view', getNotificationWhatsAppQrView);
router.post('/whatsapp/send-test', sendNotificationWhatsAppTest);

module.exports = router;
