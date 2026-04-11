const cron = require('node-cron');
const MonthlyBill = require('../models/monthlyBill');
const { sendBillPaymentReminder } = require('../services/whatsappOtpService');

/**
 * Runs every day at 9:00 AM.
 * Finds all unpaid bills issued 20+ days ago and
 * sends a WhatsApp payment reminder to the bill owner.
 */
const startBillReminderJob = () => {
  // Cron expression: "0 9 * * *" = every day at 09:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[BillReminder] Running unpaid bill check...');

    try {
      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

      // Find bills that are:
      // 1. Not paid
      // 2. Have issue date at least 20 days ago
      const unpaidBills = await MonthlyBill.find({
        isPaid: false,
        billIssueDate: { $lte: twentyDaysAgo }
      }).populate('user', 'firstName lastName email phoneNumber');

      if (unpaidBills.length === 0) {
        console.log('[BillReminder] No overdue unpaid bills found.');
        return;
      }

      console.log(`[BillReminder] Found ${unpaidBills.length} overdue unpaid bill(s). Sending WhatsApp reminders...`);

      // Send a WhatsApp reminder for each unpaid bill
      for (const bill of unpaidBills) {
        if (bill.user && bill.user.phoneNumber) {
          const result = await sendBillPaymentReminder(bill.user, bill);
          if (!result.success) {
            console.warn(`[BillReminder] WhatsApp reminder failed for bill #${bill.billNumber}: ${result.message}`);
          }
        } else {
          console.warn(`[BillReminder] Skipping bill #${bill.billNumber} — user has no phone number.`);
        }
      }

      console.log('[BillReminder] Done sending alerts.');
    } catch (error) {
      console.error('[BillReminder] Error during bill reminder job:', error.message);
    }
  });

  console.log('[BillReminder] Unpaid bill WhatsApp reminder cron job scheduled (daily at 9:00 AM).');
};

module.exports = { startBillReminderJob };
