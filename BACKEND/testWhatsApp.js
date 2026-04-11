require('dotenv').config();
const { sendWhatsAppMessage } = require('./services/whatsappService');

// Test sending a WhatsApp message
const testWhatsApp = async () => {
  console.log('🧪 Testing WhatsApp message...\n');
  
  console.log('Configuration:');
  console.log('- Account SID:', process.env.TWILIO_ACCOUNT_SID);
  console.log('- Auth Token:', process.env.TWILIO_AUTH_TOKEN ? '✓ Set' : '✗ Missing');
  console.log('- WhatsApp Number:', process.env.TWILIO_WHATSAPP_NUMBER);
  console.log('');

  // Test recipient (your WhatsApp number)
  const testNumber = '+94769823540'; // Change this to your WhatsApp number with country code
  
  const testMessage = 
    '⚡ *PowerSense Test Message*\n\n' +
    'This is a test WhatsApp notification from PowerSense.\n\n' +
    'If you receive this, the integration is working! ✅';

  console.log(`📱 Sending test message to: ${testNumber}\n`);
  
  const result = await sendWhatsAppMessage(testNumber, testMessage);
  
  if (result.success) {
    console.log('\n✅ SUCCESS! Message sent.');
    console.log('Message SID:', result.sid);
  } else {
    console.log('\n❌ FAILED to send message.');
    console.log('Error:', result.error);
  }
};

// Run the test
testWhatsApp();
