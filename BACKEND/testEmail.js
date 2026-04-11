require('dotenv').config();
const { sendEmailViaEmailJS } = require('./services/emailjsService');

// Test sending an email via EmailJS
const testEmail = async () => {
  console.log('🧪 Testing Email via EmailJS...\n');
  
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  
  if (!serviceId || serviceId === 'your_service_id') {
    console.log('❌ ERROR: EmailJS credentials not configured in .env\n');
    console.log('📧 To set up EmailJS (FREE):');
    console.log('1. Sign up at: https://www.emailjs.com/');
    console.log('2. Add Email Service (Gmail, Outlook, etc.)');
    console.log('3. Create Email Template with variables: {{to_email}}, {{subject}}, {{message}}');
    console.log('4. Get your keys from Account > API Keys');
    console.log('5. Add to .env:');
    console.log('   EMAILJS_SERVICE_ID=your_service_id');
    console.log('   EMAILJS_TEMPLATE_ID=your_template_id');
    console.log('   EMAILJS_PUBLIC_KEY=your_public_key');
    console.log('   EMAILJS_PRIVATE_KEY=your_private_key\n');
    return;
  }

  console.log('✓ Service ID:', serviceId);
  console.log('✓ Template ID:', templateId);
  console.log('✓ Public Key:', publicKey ? '***configured***' : 'MISSING');
  console.log('✓ Private Key:', privateKey ? '***configured***' : 'MISSING');
  console.log('');

  // Test recipient email
  const testRecipient = 'lawanyanisal@gmail.com'; // Your real email address

  console.log('📤 Sending test email to:', testRecipient);
  console.log('📋 Subject: PowerSense - Test Email');
  console.log('');

  try {
    const result = await sendEmailViaEmailJS(
      testRecipient,
      'PowerSense User', // Recipient name
      'PowerSense - Test Email', // Subject
      '🎉 Congratulations!\n\n' +
      'This is a test email from PowerSense.\n' +
      'Your EmailJS integration is working correctly!\n\n' +
      'This email was sent via EmailJS, which means it will be delivered to your REAL inbox.\n\n' +
      'Best regards,\n' +
      'PowerSense Team'
    );

    console.log('✅ Email sent successfully!');
    console.log('📬 Check your inbox at:', testRecipient);
    console.log('🔍 Also check spam/junk folder if you don\'t see it.\n');
    console.log('✨ EmailJS response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.error('');
    
    console.log('💡 Troubleshooting:');
    console.log('1. Check your EmailJS credentials in .env');
    console.log('2. Make sure your EmailJS service is connected (Gmail/Outlook)');
    console.log('3. Verify your EmailJS template has these variables:');
    console.log('   - {{to_email}} (recipient email)');
    console.log('   - {{to_name}} (recipient name)');
    console.log('   - {{subject}} (email subject)');
    console.log('   - {{message}} (email body)');
    console.log('   - {{from_name}} (sender name - optional)');
    console.log('   - {{reply_to}} (reply email - optional)');
    console.log('4. Check EmailJS dashboard for errors');
    console.log('5. Verify your email service is authorized in EmailJS\n');
  }
};

testEmail();
