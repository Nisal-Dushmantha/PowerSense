require('dotenv').config();
const { sendEmailViaEmailJS } = require('./services/emailjsService');

// Test sending an email via EmailJS
const testEmailJS = async () => {
  console.log('🧪 Testing Email via EmailJS...\n');
  
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  
  if (!serviceId || serviceId === 'your_service_id') {
    console.log('❌ ERROR: EmailJS not configured in .env\n');
    console.log('📧 To set up EmailJS (FREE):');
    console.log('1. Sign up at: https://www.emailjs.com/');
    console.log('2. Create an Email Service (Gmail, Outlook, etc.)');
    console.log('3. Create an Email Template');
    console.log('4. Get your keys from the dashboard');
    console.log('5. Add to .env:');
    console.log('   EMAILJS_SERVICE_ID=service_xxxxxxx');
    console.log('   EMAILJS_TEMPLATE_ID=template_xxxxxxx');
    console.log('   EMAILJS_PUBLIC_KEY=your_public_key');
    console.log('   EMAILJS_PRIVATE_KEY=your_private_key');
    console.log('   EMAILJS_REPLY_TO=youremail@gmail.com\n');
    return;
  }

  console.log('✓ Service ID:', serviceId);
  console.log('✓ Template ID:', templateId);
  console.log('✓ Public Key:', publicKey ? publicKey.substring(0, 10) + '...' : 'MISSING');
  console.log('✓ Private Key:', privateKey ? '***configured***' : 'MISSING');
  console.log('');

  // Test recipient
  const testEmail = 'lawanyanisal@gmail.com';
  const testName = 'Lawanya';
  const subject = '⚡ PowerSense Test Email';
  const message = `
Hello ${testName},

This is a test email from PowerSense to verify that EmailJS integration is working correctly!

✅ If you're reading this, the email service is operational!

Configuration Details:
━━━━━━━━━━━━━━━━━━━━━
Service: EmailJS
Sent to: ${testEmail}
Timestamp: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━

Thank you for using PowerSense Energy Management System!

Best regards,
PowerSense Team
  `;

  console.log(`📧 Sending test email to: ${testEmail}\n`);
  
  const result = await sendEmailViaEmailJS(testEmail, testName, subject, message);
  
  if (result.success) {
    console.log('\n✅ SUCCESS! Email sent via EmailJS.');
    console.log('Status:', result.status);
    console.log('\nCheck your inbox at:', testEmail);
    console.log('(Also check spam folder if you don\'t see it)');
  } else {
    console.log('\n❌ FAILED to send email.');
    console.log('Error:', result.error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure all EmailJS credentials are correct');
    console.log('2. Check that your EmailJS email service is active');
    console.log('3. Verify your template exists and is published');
    console.log('4. Check EmailJS dashboard for any errors');
  }
};

// Run the test
testEmailJS();
