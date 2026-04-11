const axios = require('axios');

/**
 * Send WhatsApp message using CallMeBot API (FREE)
 * Setup: Message "I allow callmebot to send me messages" to +34 644 41 88 77 on WhatsApp
 * Then get your API key from the response
 * 
 * @param {string} phoneNumber - Your phone number (just digits, e.g., "94769823540")
 * @param {string} apiKey - Your CallMeBot API key
 * @param {string} message - Message to send
 */
const sendWhatsAppViaCallMeBot = async (phoneNumber, apiKey, message) => {
  try {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodedMessage}&apikey=${apiKey}`;
    
    const response = await axios.get(url);
    
    if (response.status === 200) {
      console.log(`[WhatsApp] Message sent successfully to +${phoneNumber}`);
      return { success: true };
    } else {
      console.error(`[WhatsApp] Failed to send message: ${response.data}`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error(`[WhatsApp] Error sending message:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send unpaid bill alert via CallMeBot
 */
const sendUnpaidBillAlertFree = async (user, bill) => {
  if (!user.phoneNumber) {
    console.warn(`[WhatsApp] User ${user._id} has no phone number — skipping alert.`);
    return;
  }

  // Remove + and spaces from phone number
  const cleanPhone = user.phoneNumber.replace(/[\s+]/g, '');
  
  const daysSinceAdded = Math.floor(
    (Date.now() - new Date(bill.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const message =
    `⚡ PowerSense Bill Reminder\n\n` +
    `Hello ${user.firstName},\n\n` +
    `Your electricity bill #${bill.billNumber} has been unpaid for ${daysSinceAdded} days.\n\n` +
    `📅 Issue Date: ${new Date(bill.billIssueDate).toLocaleDateString()}\n` +
    `💡 Total kWh: ${bill.totalKWh} kWh\n` +
    `💰 Amount Due: LKR ${bill.balance.toFixed(2)}\n\n` +
    `Please settle your bill as soon as possible.\n\n` +
    `PowerSense Energy Management`;

  // Get API key from environment variable
  const apiKey = process.env.CALLMEBOT_API_KEY;
  
  if (!apiKey) {
    console.error('[WhatsApp] CALLMEBOT_API_KEY not set in .env');
    return { success: false, error: 'API key missing' };
  }

  return await sendWhatsAppViaCallMeBot(cleanPhone, apiKey, message);
};

module.exports = { 
  sendWhatsAppViaCallMeBot, 
  sendUnpaidBillAlertFree 
};