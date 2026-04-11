const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send a WhatsApp message via Twilio
 * @param {string} toNumber - Recipient phone number in E.164 format e.g. +94771234567
 * @param {string} message  - Message body
 */
const sendWhatsAppMessage = async (toNumber, message) => {
  try {
    const result = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${toNumber}`,
      body: message
    });
    console.log(`[WhatsApp] Message sent to ${toNumber} — SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error(`[WhatsApp] Failed to send to ${toNumber}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Build and send the unpaid bill alert message
 * @param {object} user - User document (must include firstName, phoneNumber)
 * @param {object} bill - MonthlyBill document
 */
const sendUnpaidBillAlert = async (user, bill) => {
  if (!user.phoneNumber) {
    console.warn(`[WhatsApp] User ${user._id} has no phone number — skipping alert.`);
    return;
  }

  const daysSinceAdded = Math.floor(
    (Date.now() - new Date(bill.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const message =
    `⚡ *PowerSense Bill Reminder*\n\n` +
    `Hello ${user.firstName},\n\n` +
    `Your electricity bill *#${bill.billNumber}* has been unpaid for *${daysSinceAdded} days*.\n\n` +
    `📅 Issue Date: ${new Date(bill.billIssueDate).toLocaleDateString()}\n` +
    `💡 Total kWh: ${bill.totalKWh} kWh\n` +
    `💰 Amount Due: LKR ${bill.balance.toFixed(2)}\n\n` +
    `Please settle your bill as soon as possible to avoid service interruption.\n\n` +
    `_PowerSense Energy Management_`;

  return await sendWhatsAppMessage(user.phoneNumber, message);
};

module.exports = { sendWhatsAppMessage, sendUnpaidBillAlert };