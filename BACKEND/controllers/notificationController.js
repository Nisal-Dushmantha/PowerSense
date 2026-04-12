const { initWhatsAppClient, sendWhatsApp, getWhatsAppStatus, getWhatsAppQrDataUrl } = require('../services/whatsappService');

const getNotificationWhatsAppStatus = (req, res) => {
  try {
    initWhatsAppClient();
    return res.status(200).json({
      success: true,
      data: getWhatsAppStatus()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch WhatsApp status'
    });
  }
};

const getNotificationWhatsAppQr = async (req, res) => {
  try {
    initWhatsAppClient();
    const status = getWhatsAppStatus();

    if (status.ready) {
      return res.status(200).json({
        success: true,
        data: {
          linked: true,
          message: 'WhatsApp is already linked and ready'
        }
      });
    }

    const qrDataUrl = await getWhatsAppQrDataUrl();

    if (!qrDataUrl) {
      return res.status(404).json({
        success: false,
        message: 'QR is not available yet. Wait a few seconds and try again.'
      });
    }

    return res.status(200).json({
      success: true,
      data: { qrDataUrl }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch WhatsApp QR'
    });
  }
};

const getNotificationWhatsAppQrView = async (req, res) => {
  try {
    initWhatsAppClient();
    const status = getWhatsAppStatus();
    const qrDataUrl = await getWhatsAppQrDataUrl();

    if (!status.enabled) {
      return res.status(200).send('<!doctype html><html><head><meta charset="utf-8"/><title>PowerSense WhatsApp QR</title></head><body style="font-family:Arial,sans-serif;padding:24px;"><h2>PowerSense WhatsApp QR</h2><p>WhatsApp is disabled. Set <strong>WHATSAPP_ENABLED=true</strong> and restart backend.</p></body></html>');
    }

    if (status.ready) {
      return res.status(200).send('<!doctype html><html><head><meta charset="utf-8"/><title>PowerSense WhatsApp QR</title></head><body style="font-family:Arial,sans-serif;padding:24px;"><h2>PowerSense WhatsApp QR</h2><p style="color:#0a7f32;font-weight:600;">✅ WhatsApp linked successfully.</p><p>You can close this page now and continue using PowerSense.</p></body></html>');
    }

    if (!qrDataUrl) {
      return res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"/><meta http-equiv="refresh" content="5"/><title>PowerSense WhatsApp QR</title></head><body style="font-family:Arial,sans-serif;padding:24px;"><h2>PowerSense WhatsApp QR</h2><p>QR not ready yet. Refreshing every 5 seconds...</p><p>Status: ${status.message || 'Waiting for WhatsApp client'}</p></body></html>`);
    }

    return res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"/><title>PowerSense WhatsApp QR</title></head><body style="font-family:Arial,sans-serif;padding:24px;"><h2>PowerSense WhatsApp QR</h2><p>Open WhatsApp on phone → Linked Devices → Link a Device, then scan.</p><img src="${qrDataUrl}" alt="WhatsApp QR" style="width:360px;height:360px;border:1px solid #ddd;border-radius:8px;"/></body></html>`);
  } catch (error) {
    return res.status(500).send(`<!doctype html><html><head><meta charset="utf-8"/><title>PowerSense WhatsApp QR</title></head><body style="font-family:Arial,sans-serif;padding:24px;"><h2>PowerSense WhatsApp QR</h2><p>Failed to render QR page: ${error.message || 'Unknown error'}</p></body></html>`);
  }
};

const sendNotificationWhatsAppTest = async (req, res) => {
  try {
    const { to, body } = req.body || {};

    if (!to || !body) {
      return res.status(400).json({
        success: false,
        message: 'Both to and body are required'
      });
    }

    initWhatsAppClient();
    const result = await sendWhatsApp({ to, body });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send WhatsApp test message'
    });
  }
};

module.exports = {
  getNotificationWhatsAppStatus,
  getNotificationWhatsAppQr,
  getNotificationWhatsAppQrView,
  sendNotificationWhatsAppTest
};
