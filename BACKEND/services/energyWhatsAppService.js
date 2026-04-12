const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const state = {
  client: null,
  initializing: false,
  ready: false,
  qrDataUrl: null,
  lastError: null,
  lastSendAt: null,
  lastSendSuccess: null,
  lastSentMessage: null,
  reconnectAttempts: 0
};

const isEnabled = () => String(process.env.WHATSAPP_ENABLED || 'true').toLowerCase() === 'true';
const WHATSAPP_INIT_MAX_RETRIES = Number(process.env.WHATSAPP_INIT_MAX_RETRIES || 8);
const WHATSAPP_INIT_RETRY_DELAY_MS = Number(process.env.WHATSAPP_INIT_RETRY_DELAY_MS || 4000);

const normalizePhone = (phoneNumber) => {
  if (!phoneNumber) return null;
  const digits = String(phoneNumber).replace(/[^\d]/g, '');
  if (!digits) return null;
  return `${digits}@c.us`;
};

const buildClient = () => {
  const sessionName = process.env.WHATSAPP_SESSION_NAME || 'powersense-energy';
  const authPath = process.env.WHATSAPP_AUTH_PATH || path.join(process.cwd(), '.wwebjs_auth_energy');
  fs.mkdirSync(authPath, { recursive: true });

  const chromiumPath = (() => {
    if (process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH)) return process.env.CHROMIUM_PATH;
    if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
      return process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const candidates = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      'C:/Program Files/Google/Chrome/Application/chrome.exe'
    ];

    return candidates.find((candidate) => fs.existsSync(candidate));
  })();

  return new Client({
    authStrategy: new LocalAuth({ clientId: sessionName, dataPath: authPath }),
    webVersionCache: { type: 'local' },
    authTimeoutMs: 90000,
    qrMaxRetries: 20,
    puppeteer: {
      headless: true,
      executablePath: chromiumPath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    }
  });
};

const scheduleReconnect = () => {
  if (!isEnabled()) return;
  if (state.initializing) return;
  if (state.reconnectAttempts >= WHATSAPP_INIT_MAX_RETRIES) {
    state.lastError = `Max reconnect attempts reached (${WHATSAPP_INIT_MAX_RETRIES})`;
    return;
  }

  state.reconnectAttempts += 1;
  const delayMs = state.reconnectAttempts * WHATSAPP_INIT_RETRY_DELAY_MS;

  setTimeout(() => {
    start().catch(() => null);
  }, delayMs);
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
      state.reconnectAttempts = 0;
    });

    state.client.on('auth_failure', (msg) => {
      state.ready = false;
      state.initializing = false;
      state.lastError = msg || 'WhatsApp authentication failed';
      scheduleReconnect();
    });

    state.client.on('disconnected', (reason) => {
      state.ready = false;
      state.initializing = false;
      state.lastError = reason || 'WhatsApp client disconnected';
      scheduleReconnect();
    });
  }

  try {
    await state.client.initialize();
  } catch (error) {
    state.initializing = false;
    state.ready = false;
    state.lastError = error.message;
    scheduleReconnect();
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
