const cron = require('node-cron');
const MonthlyBill = require('../models/monthlyBill');
const User = require('../models/User');
const { sendUnpaidBillAlertViaEmailJS } = require('../services/emailjsService');

/**
 * Runs every day at 9:00 AM.
 * Finds all unpaid bills that were created 10+ days ago and
 * sends a WhatsApp reminder to the bill owner.
 */
const startBillReminderJob = () => {
  // Cron expression: "0 9 * * *" = every day at 09:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[BillReminder] Running unpaid bill check...');

    try {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      // Find bills that are:
      // 1. Not paid
      // 2. Were created at least 10 days ago
      const unpaidBills = await MonthlyBill.find({
        isPaid: false,
        createdAt: { $lte: tenDaysAgo }
      }).populate('user', 'firstName lastName email phoneNumber');

      if (unpaidBills.length === 0) {
        console.log('[BillReminder] No overdue unpaid bills found.');
        return;
      }

      console.log(`[BillReminder] Found ${unpaidBills.length} overdue unpaid bill(s). Sending EmailJS alerts...`);

      // Send an EmailJS alert for each unpaid bill
      for (const bill of unpaidBills) {
        if (bill.user && bill.user.email) {
          await sendUnpaidBillAlertViaEmailJS(bill.user, bill);
        } else {
          console.warn(`[BillReminder] Skipping bill #${bill.billNumber} — user has no email.`);
        }
      }

      console.log('[BillReminder] Done sending alerts.');
    } catch (error) {
      console.error('[BillReminder] Error during bill reminder job:', error.message);
    }
  });

  console.log('[BillReminder] Unpaid bill reminder cron job scheduled (daily at 9:00 AM).');
};

module.exports = { startBillReminderJob };
