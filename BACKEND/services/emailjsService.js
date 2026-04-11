const emailjs = require('@emailjs/nodejs');

/**
 * Send an email using EmailJS
 * @param {string} toEmail - Recipient email address
 * @param {string} toName - Recipient name
 * @param {string} subject - Email subject
 * @param {string} message - Email message (plain text or HTML)
 */
const sendEmailViaEmailJS = async (toEmail, toName, subject, message) => {
  try {
    const templateParams = {
      to_email: toEmail,
      to_name: toName,
      subject: subject,
      message: message,
      from_name: 'PowerSense',
      reply_to: process.env.EMAILJS_REPLY_TO || 'noreply@powersense.com'
    };

    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    console.log(`[EmailJS] Message sent to ${toEmail} — Status: ${response.status}`);
    return { success: true, status: response.status };
  } catch (error) {
    console.error(`[EmailJS] Failed to send to ${toEmail}:`, error.text || error.message || error);
    return { 
      success: false, 
      error: error.text || error.message || JSON.stringify(error) 
    };
  }
};

/**
 * Send unpaid bill alert email via EmailJS
 * @param {object} user - User document (must include firstName, email)
 * @param {object} bill - MonthlyBill document
 */
const sendUnpaidBillAlertViaEmailJS = async (user, bill) => {
  if (!user.email) {
    console.warn(`[EmailJS] User ${user._id} has no email — skipping alert.`);
    return;
  }

  const daysSinceAdded = Math.floor(
    (Date.now() - new Date(bill.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const subject = `⚡ PowerSense Bill Reminder - Bill #${bill.billNumber}`;

  const message = `
Hello ${user.firstName},

This is a friendly reminder that your electricity bill has been unpaid for ${daysSinceAdded} days.

📋 BILL DETAILS
━━━━━━━━━━━━━━━━━━━━━
Bill Number: #${bill.billNumber}
Issue Date: ${new Date(bill.billIssueDate).toLocaleDateString()}
Total kWh: ${bill.totalKWh} kWh
Total Amount: LKR ${bill.totalPayment.toFixed(2)}
Already Paid: LKR ${bill.totalPaid.toFixed(2)}

💰 AMOUNT DUE: LKR ${bill.balance.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT: Please settle your bill as soon as possible to avoid service interruption or late payment fees.

Thank you for using PowerSense to manage your energy consumption.

━━━━━━━━━━━━━━━━━━━━━
PowerSense Energy Management
© ${new Date().getFullYear()} All rights reserved.
  `;

  return await sendEmailViaEmailJS(user.email, user.firstName, subject, message);
};

module.exports = { sendEmailViaEmailJS, sendUnpaidBillAlertViaEmailJS };
