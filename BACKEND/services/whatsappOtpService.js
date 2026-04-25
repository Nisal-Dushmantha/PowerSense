const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const notificationWhatsAppService = require('./whatsappService');

const otpStore = new Map();

let whatsappClient;
let clientReady = false;
let clientInitializing = false;
let initPromise = null;
let initRetryCount = 0;
let isRestartingClient = false;
let retryTimeoutHandle = null;

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_VERIFIED_WINDOW_MINUTES = Number(process.env.OTP_VERIFIED_WINDOW_MINUTES || 15);
const WHATSAPP_INIT_MAX_RETRIES = Number(process.env.WHATSAPP_INIT_MAX_RETRIES || 3);
const WHATSAPP_INIT_RETRY_DELAY_MS = Number(process.env.WHATSAPP_INIT_RETRY_DELAY_MS || 5000);
const WHATSAPP_QR_MAX_RETRIES = Number(process.env.WHATSAPP_QR_MAX_RETRIES || 10);

const WHATSAPP_AUTH_DATA_PATH = path.resolve(process.env.WHATSAPP_AUTH_DATA_PATH || '.wwebjs_auth_otp');
const WHATSAPP_CLIENT_ID = process.env.WHATSAPP_CLIENT_ID || 'powersense-otp';
let activeClientId = WHATSAPP_CLIENT_ID;
let hasSwitchedClientId = false;

const isWhatsAppOtpEnabled = () => process.env.WHATSAPP_WEB_ENABLED === 'true';
const isBillNotificationEnabled = () => process.env.WHATSAPP_BILL_NOTIFICATIONS_ENABLED !== 'false';
const useSharedWhatsAppClient = () => String(process.env.WHATSAPP_SHARE_CLIENT || 'true').toLowerCase() === 'true';

const resolveChromiumPath = () => {
  if (process.env.CHROMIUM_PATH) {
    return process.env.CHROMIUM_PATH;
  }

  const candidates = ['/usr/bin/chromium-browser', '/usr/bin/chromium', 'C:/Program Files/Google/Chrome/Application/chrome.exe'];
  return candidates.find((candidate) => fs.existsSync(candidate));
};

const normalizePhoneNumber = (phoneNumber) => {
  const digitsOnly = String(phoneNumber || '').replace(/\D/g, '');
  return digitsOnly;
};

const validatePhoneNumber = (phoneNumber) => {
  const normalized = normalizePhoneNumber(phoneNumber);

  if (!normalized || normalized.length < 10 || normalized.length > 15) {
    return {
      valid: false,
      message: 'Provide a valid WhatsApp number with country code'
    };
  }

  return {
    valid: true,
    normalized
  };
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const scheduleInitRetry = () => {
  if (retryTimeoutHandle) {
    clearTimeout(retryTimeoutHandle);
    retryTimeoutHandle = null;
  }

  if (initRetryCount >= WHATSAPP_INIT_MAX_RETRIES) {
    console.error(`[WhatsApp OTP] Max init retries reached (${WHATSAPP_INIT_MAX_RETRIES}).`);
    return;
  }

  initRetryCount += 1;
  const delayMs = WHATSAPP_INIT_RETRY_DELAY_MS * initRetryCount;
  console.warn(`[WhatsApp OTP] Retrying client initialization in ${Math.round(delayMs / 1000)}s (attempt ${initRetryCount}/${WHATSAPP_INIT_MAX_RETRIES}).`);

  retryTimeoutHandle = setTimeout(() => {
    retryTimeoutHandle = null;
    initializeWhatsAppClient().catch(() => null);
  }, delayMs);
};

const clearChromiumSingletonLocks = (clientId = activeClientId) => {
  try {
    const sessionDir = path.join(WHATSAPP_AUTH_DATA_PATH, `session-${clientId}`);
    const lockFiles = ['SingletonLock', 'SingletonSocket', 'SingletonCookie'];

    for (const file of lockFiles) {
      const filePath = path.join(sessionDir, file);
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }
    }
  } catch (error) {
    console.warn('[WhatsApp OTP] Failed to clear Chromium lock files:', error.message);
  }
};

const restartWhatsAppClient = async ({ immediate = false, reason = 'Unknown' } = {}) => {
  if (isRestartingClient) {
    return;
  }

  isRestartingClient = true;
  clientReady = false;
  clientInitializing = false;
  initPromise = null;

  if (retryTimeoutHandle) {
    clearTimeout(retryTimeoutHandle);
    retryTimeoutHandle = null;
  }

  const clientToDestroy = whatsappClient;
  whatsappClient = null;

  try {
    if (clientToDestroy) {
      clientToDestroy.removeAllListeners();
      await clientToDestroy.destroy().catch(() => null);
    }
  } finally {
    isRestartingClient = false;
  }

  if (immediate) {
    console.warn(`[WhatsApp OTP] Restarting client immediately (${reason}).`);
    initializeWhatsAppClient().catch(() => null);
    return;
  }

  console.warn(`[WhatsApp OTP] Scheduling client restart (${reason}).`);
  scheduleInitRetry();
};

const initializeWhatsAppClient = async () => {
  if (!isWhatsAppOtpEnabled()) {
    console.log('[WhatsApp OTP] WHATSAPP_WEB_ENABLED is false. OTP sender is disabled.');
    return getWhatsAppOtpStatus();
  }

  if (useSharedWhatsAppClient()) {
    notificationWhatsAppService.initWhatsAppClient();
    return getWhatsAppOtpStatus();
  }

  if (clientReady) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    clientInitializing = true;

    const clientInstance = new Client({
      authStrategy: new LocalAuth({
        clientId: activeClientId,
        dataPath: WHATSAPP_AUTH_DATA_PATH
      }),
      qrMaxRetries: WHATSAPP_QR_MAX_RETRIES,
      puppeteer: {
        headless: true,
        executablePath: resolveChromiumPath(),
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      }
    });

    whatsappClient = clientInstance;

    clientInstance.on('qr', (qr) => {
      if (whatsappClient !== clientInstance) {
        return;
      }

      console.log('[WhatsApp OTP] Scan this QR code in WhatsApp:');
      qrcodeTerminal.generate(qr, { small: true });
    });

    clientInstance.on('ready', () => {
      if (whatsappClient !== clientInstance) {
        return;
      }

      clientReady = true;
      clientInitializing = false;
      initRetryCount = 0;

      if (retryTimeoutHandle) {
        clearTimeout(retryTimeoutHandle);
        retryTimeoutHandle = null;
      }

      console.log('[WhatsApp OTP] Client is ready.');
    });

    clientInstance.on('auth_failure', (message) => {
      if (whatsappClient !== clientInstance) {
        return;
      }

      clientReady = false;
      clientInitializing = false;
      lastError = `Authentication failed: ${message}`;
      console.error('[WhatsApp OTP] Authentication failure:', message);
    });

    clientInstance.on('disconnected', (reason) => {
      if (whatsappClient !== clientInstance) {
        console.warn('[WhatsApp OTP] Ignoring disconnected event from stale client:', reason);
        return;
      }

      clientReady = false;
      clientInitializing = false;
      console.warn('[WhatsApp OTP] Client disconnected:', reason);

      const reasonText = String(reason || '');
      if (/Max qrcode retries reached/i.test(reasonText)) {
        restartWhatsAppClient({ immediate: true, reason: reasonText });
        return;
      }

      restartWhatsAppClient({ immediate: false, reason: reasonText });
    });

    try {
      await clientInstance.initialize();
    } catch (error) {
      if (whatsappClient !== clientInstance) {
        return;
      }

      clientInitializing = false;
      clientReady = false;
      const message = error?.message || 'Unknown error';
      lastError = message;
      console.error('[WhatsApp OTP] Failed to initialize client:', message);

      if (/browser is already running/i.test(message)) {
        clearChromiumSingletonLocks();

        if (!hasSwitchedClientId) {
          activeClientId = `${WHATSAPP_CLIENT_ID}-fallback`;
          hasSwitchedClientId = true;
          console.warn(`[WhatsApp OTP] Auth profile is locked. Switching to fallback clientId: ${activeClientId}`);
        }

        scheduleInitRetry();
      } else if (/Execution context was destroyed|Target closed|Session closed|Protocol error/i.test(message)) {
        scheduleInitRetry();
      }
    }
  })().finally(() => {
    initPromise = null;
  });

  return initPromise;
};

const getWhatsAppOtpStatus = () => {
  if (!isWhatsAppOtpEnabled()) {
    return {
      enabled: false,
      ready: false,
      initializing: false,
      hasQr: false,
      message: 'WhatsApp OTP is disabled'
    };
  }

  if (useSharedWhatsAppClient()) {
    const sharedStatus = notificationWhatsAppService.getWhatsAppStatus();
    return {
      enabled: Boolean(sharedStatus.enabled),
      ready: Boolean(sharedStatus.ready),
      initializing: !sharedStatus.ready,
      hasQr: Boolean(sharedStatus.hasQr),
      message: sharedStatus.message || 'WhatsApp shared client not ready'
    };
  }

  return {
    enabled: true,
    ready: clientReady,
    initializing: clientInitializing,
    hasQr: Boolean(latestQrText),
    message: lastError || (clientReady ? 'WhatsApp OTP client is ready' : 'WhatsApp OTP client not ready. Scan QR to connect')
  };
};

const getWhatsAppOtpQrDataUrl = async () => {
  if (useSharedWhatsAppClient()) {
    return notificationWhatsAppService.getWhatsAppQrDataUrl();
  }

  if (!latestQrText) {
    return null;
  }

  return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(latestQrText)}`;
};

const sendWhatsAppMessage = async (phoneNumber, message) => {
  if (!isWhatsAppOtpEnabled()) {
    const error = new Error('WhatsApp OTP is disabled on this server');
    error.status = 503;
    throw error;
  }

  if (!whatsappClient || !clientReady) {
    await initializeWhatsAppClient();
  }

  if (useSharedWhatsAppClient()) {
    const result = await notificationWhatsAppService.sendWhatsApp({
      to: phoneNumber,
      body: message
    });

    if (!result.sent) {
      const error = new Error(result.message || 'WhatsApp shared client failed to send message');
      error.status = result.message && result.message.toLowerCase().includes('invalid') ? 400 : 503;
      throw error;
    }
    return;
  }

  if (!whatsappClient || !clientReady) {
    const error = new Error('WhatsApp client is not ready yet. Scan the QR and retry.');
    error.status = 503;
    throw error;
  }

  let numberId;

  try {
    numberId = await whatsappClient.getNumberId(phoneNumber);
  } catch (lookupError) {
    const error = new Error('Failed to validate WhatsApp number. Try again in a moment.');
    error.status = 503;
    throw error;
  }

  if (!numberId || !numberId._serialized) {
    const error = new Error('This number is not available on WhatsApp. Use a valid WhatsApp number.');
    error.status = 400;
    throw error;
  }

  try {
    await whatsappClient.sendMessage(numberId._serialized, message);
  } catch (sendError) {
    const messageText = sendError?.message || '';
    const error = new Error(
      messageText.includes('Evaluation failed') || messageText === 't: t'
        ? 'Failed to send OTP via WhatsApp. Ensure the number is valid and WhatsApp is connected.'
        : 'Failed to send OTP via WhatsApp. Please try again.'
    );
    error.status = 502;
    throw error;
  }
};

const sendOtp = async (phoneNumber) => {
  const validation = validatePhoneNumber(phoneNumber);
  if (!validation.valid) {
    return { success: false, status: 400, message: validation.message };
  }

  const normalized = validation.normalized;
  const now = Date.now();
  const existing = otpStore.get(normalized);

  if (existing && existing.lastSentAt && now - existing.lastSentAt < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
    const secondsLeft = Math.ceil((OTP_RESEND_COOLDOWN_SECONDS * 1000 - (now - existing.lastSentAt)) / 1000);
    return {
      success: false,
      status: 429,
      message: `Please wait ${secondsLeft}s before requesting another OTP`
    };
  }

  const code = generateOtp();
  const expiresAt = now + OTP_EXPIRY_MINUTES * 60 * 1000;

  const otpMessage =
    `PowerSense OTP verification\n` +
    `Code: ${code}\n` +
    `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`;

  try {
    await sendWhatsAppMessage(normalized, otpMessage);
  } catch (error) {
    return {
      success: false,
      status: error.status || 500,
      message: error.message || 'Failed to send OTP'
    };
  }

  otpStore.set(normalized, {
    code,
    expiresAt,
    attempts: 0,
    lastSentAt: now,
    verifiedUntil: null
  });

  return {
    success: true,
    normalized,
    message: 'OTP sent via WhatsApp'
  };
};

const verifyOtp = (phoneNumber, otp) => {
  const validation = validatePhoneNumber(phoneNumber);
  if (!validation.valid) {
    return { success: false, status: 400, message: validation.message };
  }

  const normalized = validation.normalized;
  const record = otpStore.get(normalized);

  if (!record) {
    return { success: false, status: 400, message: 'No OTP request found for this number' };
  }

  const now = Date.now();

  if (now > record.expiresAt) {
    otpStore.delete(normalized);
    return { success: false, status: 400, message: 'OTP has expired. Request a new OTP' };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    otpStore.delete(normalized);
    return { success: false, status: 400, message: 'Too many invalid attempts. Request a new OTP' };
  }

  if (record.code !== String(otp || '')) {
    record.attempts += 1;
    otpStore.set(normalized, record);
    return { success: false, status: 400, message: 'Invalid OTP code' };
  }

  record.verifiedUntil = now + OTP_VERIFIED_WINDOW_MINUTES * 60 * 1000;
  otpStore.set(normalized, record);

  return { success: true, normalized, message: 'OTP verified successfully' };
};

const isPhoneVerified = (phoneNumber) => {
  const normalized = normalizePhoneNumber(phoneNumber);
  const record = otpStore.get(normalized);
  if (!record || !record.verifiedUntil) {
    return false;
  }
  return Date.now() <= record.verifiedUntil;
};

const consumePhoneVerification = (phoneNumber) => {
  const normalized = normalizePhoneNumber(phoneNumber);
  otpStore.delete(normalized);
};

const sendWhatsAppText = async (phoneNumber, message) => {
  const validation = validatePhoneNumber(phoneNumber);
  if (!validation.valid) {
    return { success: false, status: 400, message: validation.message };
  }

  try {
    await sendWhatsAppMessage(validation.normalized, message);
    return { success: true, normalized: validation.normalized };
  } catch (error) {
    return {
      success: false,
      status: error.status || 500,
      message: error.message || 'Failed to send WhatsApp message'
    };
  }
};

const sendBillCreatedSummary = async (user, bill) => {
  if (!isBillNotificationEnabled()) {
    return { success: false, status: 200, message: 'Bill notifications disabled' };
  }

  if (!user || !user.phoneNumber) {
    return { success: false, status: 400, message: 'User has no phone number' };
  }

  const issueDate = new Date(bill.billIssueDate).toLocaleDateString();
  const paidAmount = Number(bill.totalPaid || 0).toFixed(2);
  const totalAmount = Number(bill.totalPayment || 0).toFixed(2);
  const balance = Number(bill.balance || 0).toFixed(2);

  const message =
    `PowerSense Bill Added\n\n` +
    `Bill #: ${bill.billNumber}\n` +
    `Issue Date: ${issueDate}\n` +
    `Usage: ${bill.totalKWh} kWh\n` +
    `Total: LKR ${totalAmount}\n` +
    `Paid: LKR ${paidAmount}\n` +
    `Balance: LKR ${balance}\n` +
    `Status: ${bill.isPaid ? 'Paid' : 'Pending'}`;

  return sendWhatsAppText(user.phoneNumber, message);
};

const sendBillPaymentReminder = async (user, bill, options = {}) => {
  if (!isBillNotificationEnabled()) {
    return { success: false, status: 200, message: 'Bill notifications disabled' };
  }

  if (!user || !user.phoneNumber) {
    return { success: false, status: 400, message: 'User has no phone number' };
  }

  const issueDate = new Date(bill.billIssueDate);
  const today = new Date();
  const msInDay = 1000 * 60 * 60 * 24;
  const daysSinceIssue = Math.floor((today.getTime() - issueDate.getTime()) / msInDay);
  const totalAmount = Number(bill.totalPayment || 0);
  const paidAmount = Number(bill.totalPaid || 0);
  const balance = Number(bill.balance || (totalAmount - paidAmount));
  const amountText = balance > 0 ? `LKR ${balance.toFixed(2)}` : `LKR ${totalAmount.toFixed(2)}`;
  const testPrefix = options.isTest ? 'TEST MODE\n' : '';

  const message =
    `${testPrefix}🚨 *PowerSense Bill Payment Reminder* 🚨\n\n` +
    `⚠️ Bill #${bill.billNumber} is pending for ${daysSinceIssue} days.\n` +
    `📅 Issue Date: ${issueDate.toLocaleDateString()}\n` +
    `💡 Usage: ${bill.totalKWh} kWh\n` +
    `💰 Total Bill: LKR ${totalAmount.toFixed(2)}\n` +
    `✅ Paid: LKR ${paidAmount.toFixed(2)}\n` +
    `❗ Amount Due: *${amountText}*\n\n` +
    `🔥 Please pay ${balance > 0 ? 'the remaining amount' : 'the bill amount'} as soon as possible to avoid penalties or service interruption.`;

  return sendWhatsAppText(user.phoneNumber, message);
};

module.exports = {
  initializeWhatsAppClient,
  getWhatsAppOtpStatus,
  getWhatsAppOtpQrDataUrl,
  sendOtp,
  verifyOtp,
  normalizePhoneNumber,
  validatePhoneNumber,
  isPhoneVerified,
  consumePhoneVerification,
  isWhatsAppOtpEnabled,
  sendWhatsAppText,
  sendBillCreatedSummary,
  sendBillPaymentReminder,
  isBillNotificationEnabled
};