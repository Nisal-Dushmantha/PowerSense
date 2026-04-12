const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const state = {
  client: null,
  initializing: false,
  ready: false,
  qrDataUrl: null,
  lastError: null,
  lastSendAt: null,
  lastSendSuccess: null,
  lastSentMessage: null
};

const isEnabled = () => String(process.env.WHATSAPP_ENABLED || 'true').toLowerCase() === 'true';

const normalizePhone = (phoneNumber) => {
  if (!phoneNumber) return null;
  const digits = String(phoneNumber).replace(/[^\d]/g, '');
  if (!digits) return null;
  return `${digits}@c.us`;
};

const buildClient = () => {
  const sessionName = process.env.WHATSAPP_SESSION_NAME || 'powersense-energy';

  return new Client({
    authStrategy: new LocalAuth({ clientId: sessionName }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });
};

const start = async () => {
  if (!isEnabled()) {
    return {
      enabled: false,
      initializing: false,
      ready: false,
      qrAvailable: false,
      lastError: 'WHATSAPP_ENABLED is false'
    };
  }

  if (state.ready || state.initializing) {
    return getStatus();
  }

  state.initializing = true;
  state.lastError = null;

  if (!state.client) {
    state.client = buildClient();

    state.client.on('qr', (qr) => {
      state.ready = false;
      state.lastError = null;
      state.qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qr)}`;
      qrcode.generate(qr, { small: true });
    });

    state.client.on('ready', () => {
      state.ready = true;
      state.initializing = false;
      state.lastError = null;
      state.qrDataUrl = null;
    });

    state.client.on('auth_failure', (msg) => {
      state.ready = false;
      state.initializing = false;
      state.lastError = msg || 'WhatsApp authentication failed';
    });

    state.client.on('disconnected', (reason) => {
      state.ready = false;
      state.initializing = false;
      state.lastError = reason || 'WhatsApp client disconnected';
    });
  }

  try {
    await state.client.initialize();
  } catch (error) {
    state.initializing = false;
    state.ready = false;
    state.lastError = error.message;
    throw error;
  }

  return getStatus();
};

const getStatus = () => ({
  enabled: isEnabled(),
  initializing: state.initializing,
  ready: state.ready,
  qrAvailable: Boolean(state.qrDataUrl),
  lastError: state.lastError,
  lastSendAt: state.lastSendAt,
  lastSendSuccess: state.lastSendSuccess,
  lastSentMessage: state.lastSentMessage
});

const getQrDataUrl = () => state.qrDataUrl;

const sendMessage = async (phoneNumber, message) => {
  if (!isEnabled()) {
    throw new Error('WhatsApp is disabled by server configuration');
  }

  if (!state.ready || !state.client) {
    throw new Error('WhatsApp client not ready');
  }

  const chatId = normalizePhone(phoneNumber);
  if (!chatId) {
    throw new Error('Invalid phone number');
  }

  try {
    const result = await state.client.sendMessage(chatId, message);
    state.lastSendAt = new Date().toISOString();
    state.lastSendSuccess = true;
    state.lastSentMessage = message;
    state.lastError = null;

    return {
      id: result?.id?._serialized || null,
      timestamp: result?.timestamp || null,
      to: phoneNumber
    };
  } catch (error) {
    state.lastSendAt = new Date().toISOString();
    state.lastSendSuccess = false;
    state.lastError = error.message;
    throw error;
  }
};

module.exports = {
  isEnabled,
  start,
  getStatus,
  getQrDataUrl,
  sendMessage
};
