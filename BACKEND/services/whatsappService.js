const fs = require('fs');
const path = require('path');
const qrcodeTerminal = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

let client;
let initialized = false;
let initializing = false;
let ready = false;
let lastError = null;
let latestQrText = null;

const isWhatsAppEnabled = () => String(process.env.WHATSAPP_ENABLED || 'true').toLowerCase() === 'true';

const normalizeToE164 = (value) => {
  if (!value) return null;

  const cleaned = String(value).replace(/[\s()-]/g, '');

  if (cleaned.startsWith('+')) {
    return /^\+[1-9]\d{7,14}$/.test(cleaned) ? cleaned : null;
  }

  if (/^0\d{9}$/.test(cleaned)) return `+94${cleaned.slice(1)}`;
  if (/^94\d{9}$/.test(cleaned)) return `+${cleaned}`;
  if (/^7\d{8}$/.test(cleaned)) return `+94${cleaned}`;

  return null;
};

const resolveChromiumPath = () => {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;

  const candidates = ['/usr/bin/chromium-browser', '/usr/bin/chromium', 'C:/Program Files/Google/Chrome/Application/chrome.exe'];
  return candidates.find((candidate) => fs.existsSync(candidate));
};

const clearStaleChromiumLocks = (authPath) => {
  try {
    if (!fs.existsSync(authPath)) return;

    const lockFiles = [];
    const walk = (dir) => {
      for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          walk(fullPath);
          continue;
        }
        if (['SingletonLock', 'SingletonCookie', 'SingletonSocket'].includes(item.name)) {
          lockFiles.push(fullPath);
        }
      }
    };

    walk(authPath);
    lockFiles.forEach((filePath) => {
      try {
        fs.rmSync(filePath, { force: true });
      } catch (error) {
        console.warn('[WhatsApp] Failed to remove lock file:', filePath, error.message);
      }
    });
  } catch (error) {
    console.warn('[WhatsApp] Failed to clear stale Chromium lock files:', error.message);
  }
};

const initWhatsAppClient = () => {
  if (!isWhatsAppEnabled()) return;
  if (initialized || initializing) return;

  initialized = true;
  initializing = true;

  const sessionName = process.env.WHATSAPP_SESSION_NAME || 'powersense-notifier';
  const authPath = process.env.WHATSAPP_AUTH_PATH || path.join(process.cwd(), '.wwebjs_auth_notifications');
  clearStaleChromiumLocks(authPath);

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: sessionName,
      dataPath: authPath
    }),
    webVersionCache: {
      type: 'none'
    },
    authTimeoutMs: 90000,
    qrMaxRetries: 20,
    puppeteer: {
      headless: true,
      executablePath: resolveChromiumPath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
  });

  client.on('qr', (qr) => {
    ready = false;
    latestQrText = qr;
    lastError = null;
    console.log('[WhatsApp] Scan this QR to connect the client.');
    qrcodeTerminal.generate(qr, { small: true });
  });

  client.on('ready', () => {
    ready = true;
    initializing = false;
    latestQrText = null;
    lastError = null;
    console.log('[WhatsApp] Client is ready.');
  });

  client.on('auth_failure', (message) => {
    ready = false;
    initializing = false;
    lastError = `Authentication failed: ${message}`;
    console.error('[WhatsApp] Authentication failed:', message);
  });

  client.on('disconnected', (reason) => {
    ready = false;
    initializing = false;
    lastError = `Disconnected: ${reason}`;
    console.warn('[WhatsApp] Client disconnected:', reason);
  });

  client.initialize().catch((error) => {
    ready = false;
    initializing = false;
    lastError = error.message;
    console.error('[WhatsApp] Initialization failed:', error.message);
  });
};

const sendWhatsApp = async ({ to, body }) => {
  if (!isWhatsAppEnabled()) {
    return { sent: false, skipped: true, message: 'WhatsApp is disabled' };
  }

  if (!client || !ready) {
    return {
      sent: false,
      skipped: true,
      message: lastError || 'WhatsApp client is not ready. Scan QR and wait for ready state'
    };
  }

  const normalizedTo = normalizeToE164(to);
  if (!normalizedTo) {
    return {
      sent: false,
      skipped: true,
      message: 'Invalid recipient phone number format. Use +94..., 94..., 0..., or local mobile format.'
    };
  }

  try {
    const chatId = `${normalizedTo.replace(/\D/g, '')}@c.us`;
    const result = await client.sendMessage(chatId, body);
    return {
      sent: true,
      skipped: false,
      message: 'WhatsApp message sent',
      id: result?.id?._serialized,
      to: normalizedTo
    };
  } catch (error) {
    return {
      sent: false,
      skipped: true,
      message: error.message || 'Failed to send WhatsApp message',
      to: normalizedTo
    };
  }
};

const getWhatsAppStatus = () => {
  if (!isWhatsAppEnabled()) {
    return { enabled: false, ready: false, hasQr: false, message: 'WhatsApp is disabled' };
  }

  if (ready) {
    return { enabled: true, ready: true, hasQr: false, message: 'WhatsApp client is ready' };
  }

  return {
    enabled: true,
    ready: false,
    hasQr: Boolean(latestQrText),
    message: lastError || 'WhatsApp client not ready. Scan QR to connect'
  };
};

const getWhatsAppQrDataUrl = async () => {
  if (!latestQrText) return null;
  return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(latestQrText)}`;
};

const sendWhatsAppMessage = async (toNumber, message) => {
  const result = await sendWhatsApp({ to: toNumber, body: message });
  return result.sent ? { success: true, sid: result.id } : { success: false, error: result.message };
};

const sendUnpaidBillAlert = async (user, bill) => {
  if (!user.phoneNumber) {
    console.warn(`[WhatsApp] User ${user._id} has no phone number — skipping alert.`);
    return { success: false, skipped: true, message: 'User has no phone number' };
  }

  const daysSinceAdded = Math.floor((Date.now() - new Date(bill.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const message =
    `⚡ *PowerSense Bill Reminder*\n\n` +
    `Hello ${user.firstName},\n\n` +
    `Your electricity bill *#${bill.billNumber}* has been unpaid for *${daysSinceAdded} days*.\n\n` +
    `📅 Issue Date: ${new Date(bill.billIssueDate).toLocaleDateString()}\n` +
    `💡 Total kWh: ${bill.totalKWh} kWh\n` +
    `💰 Amount Due: LKR ${bill.balance.toFixed(2)}\n\n` +
    `Please settle your bill as soon as possible to avoid service interruption.\n\n` +
    `_PowerSense Energy Management_`;

  return sendWhatsApp({ to: user.phoneNumber, body: message });
};

module.exports = {
  initWhatsAppClient,
  sendWhatsApp,
  getWhatsAppStatus,
  getWhatsAppQrDataUrl,
  normalizeToE164,
  sendWhatsAppMessage,
  sendUnpaidBillAlert
};