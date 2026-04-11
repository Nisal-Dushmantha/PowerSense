const nodemailer = require('nodemailer');

// Create reusable transporter 
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
  port: process.env.EMAIL_PORT || 2525,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content of the email
 */
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'PowerSense <noreply@powersense.com>',
      to: to,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Message sent to ${to} — ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send unpaid bill alert email
 * @param {object} user - User document (must include firstName, email)
 * @param {object} bill - MonthlyBill document
 */
const sendUnpaidBillAlertEmail = async (user, bill) => {
  if (!user.email) {
    console.warn(`[Email] User ${user._id} has no email — skipping alert.`);
    return;
  }

  const daysSinceAdded = Math.floor(
    (Date.now() - new Date(bill.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const subject = `⚡ PowerSense Bill Reminder - Bill #${bill.billNumber}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .bill-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #667eea;
        }
        .bill-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .bill-row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: bold;
          color: #667eea;
        }
        .amount-due {
          font-size: 24px;
          font-weight: bold;
          color: #e74c3c;
          text-align: center;
          margin: 20px 0;
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffc107;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚡ PowerSense</h1>
        <p>Bill Payment Reminder</p>
      </div>
      <div class="content">
        <h2>Hello ${user.firstName},</h2>
        <p>This is a friendly reminder that your electricity bill has been unpaid for <strong>${daysSinceAdded} days</strong>.</p>
        
        <div class="bill-details">
          <h3>Bill Details</h3>
          <div class="bill-row">
            <span class="label">Bill Number:</span>
            <span>#${bill.billNumber}</span>
          </div>
          <div class="bill-row">
            <span class="label">Issue Date:</span>
            <span>${new Date(bill.billIssueDate).toLocaleDateString()}</span>
          </div>
          <div class="bill-row">
            <span class="label">Total kWh:</span>
            <span>${bill.totalKWh} kWh</span>
          </div>
          <div class="bill-row">
            <span class="label">Total Amount:</span>
            <span>LKR ${bill.totalPayment.toFixed(2)}</span>
          </div>
          <div class="bill-row">
            <span class="label">Already Paid:</span>
            <span>LKR ${bill.totalPaid.toFixed(2)}</span>
          </div>
        </div>

        <div class="amount-due">
          💰 Amount Due: LKR ${bill.balance.toFixed(2)}
        </div>

        <div class="warning">
          <strong>⚠️ Important:</strong> Please settle your bill as soon as possible to avoid service interruption or late payment fees.
        </div>

        <p>Thank you for using PowerSense to manage your energy consumption.</p>
      </div>
      <div class="footer">
        <p>This is an automated message from PowerSense Energy Management System</p>
        <p>© ${new Date().getFullYear()} PowerSense. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(user.email, subject, htmlContent);
};

module.exports = { sendEmail, sendUnpaidBillAlertEmail };
