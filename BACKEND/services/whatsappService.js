const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const normalizeBoolean = (value) => String(value).toLowerCase() === 'true';

const sanitizePhone = (value = '') => value.replace(/[^\d]/g, '');

const toChatId = (phoneNumber) => {
  const digits = sanitizePhone(phoneNumber);
  if (!digits || digits.length < 10) {
    throw new Error('Invalid phone number. Use an international number like +9477xxxxxxx');
  }
  return `${digits}@c.us`;
};

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.isInitializing = false;
    this.qrDataUrl = null;
    this.lastError = null;
    this.lastSendAt = null;
    this.lastSendSuccess = null;
    this.lastSentMessage = null;
    this.sessionName = process.env.WHATSAPP_SESSION_NAME || 'powersense-notifier';
  }

  isEnabled() {
    return normalizeBoolean(process.env.WHATSAPP_ENABLED || 'false');
  }

  getStatus() {
    return {
      enabled: this.isEnabled(),
      ready: this.isReady,
      initializing: this.isInitializing,
      hasQr: Boolean(this.qrDataUrl),
      sessionName: this.sessionName,
      lastError: this.lastError,
      lastSendAt: this.lastSendAt,
      lastSendSuccess: this.lastSendSuccess,
      lastSentMessage: this.lastSentMessage
    };
  }

  async start() {
    if (!this.isEnabled()) {
      throw new Error('WhatsApp integration is disabled. Set WHATSAPP_ENABLED=true in .env');
    }

    if (this.isReady) return this.getStatus();
    if (this.isInitializing) return this.getStatus();

    this.isInitializing = true;
    this.lastError = null;

    try {
      this.client = new Client({
        authStrategy: new LocalAuth({ clientId: this.sessionName }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      this.client.on('qr', async (qr) => {
        try {
          this.qrDataUrl = await qrcode.toDataURL(qr);
          this.lastError = null;
        } catch (error) {
          this.lastError = `Failed generating QR data URL: ${error.message}`;
        }
      });

      this.client.on('ready', () => {
        this.isReady = true;
        this.isInitializing = false;
        this.qrDataUrl = null;
        this.lastError = null;
      });

      this.client.on('auth_failure', (message) => {
        this.isReady = false;
        this.isInitializing = false;
        this.lastError = `Authentication failed: ${message}`;
      });

      this.client.on('disconnected', (reason) => {
        this.isReady = false;
        this.isInitializing = false;
        this.lastError = `Client disconnected: ${reason}`;
      });

      await this.client.initialize();
      return this.getStatus();
    } catch (error) {
      this.isInitializing = false;
      this.isReady = false;
      this.lastError = error.message;
      throw error;
    }
  }

  async sendMessage(phoneNumber, message) {
    if (!this.isEnabled()) {
      throw new Error('WhatsApp integration is disabled. Set WHATSAPP_ENABLED=true in .env');
    }

    if (!this.client || (!this.isReady && !this.isInitializing)) {
      await this.start();
    }

    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready yet. Scan QR and wait until status becomes ready.');
    }

    const chatId = toChatId(phoneNumber);

    try {
      const sent = await this.client.sendMessage(chatId, message);

      const sendInfo = {
        id: sent.id?._serialized || null,
        to: chatId,
        timestamp: sent.timestamp || null
      };

      this.lastSendAt = new Date().toISOString();
      this.lastSendSuccess = true;
      this.lastSentMessage = sendInfo;
      this.lastError = null;

      return sendInfo;
    } catch (error) {
      this.lastSendAt = new Date().toISOString();
      this.lastSendSuccess = false;
      this.lastSentMessage = {
        to: chatId,
        error: error.message
      };
      this.lastError = `Send failed: ${error.message}`;
      throw error;
    }
  }

  getQrDataUrl() {
    return this.qrDataUrl;
  }
}

module.exports = new WhatsAppService();
