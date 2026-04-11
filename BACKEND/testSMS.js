require('dotenv').config();
const { sendSMS } = require('./services/smsService');

// Test sending an SMS message
const testSMS = async () => {
  console.log('🧪 Testing SMS message via Twilio...\n');
  
  console.log('Configuration:');
  console.log('- Account SID:', process.env.TWILIO_ACCOUNT_SID);
  console.log('- Auth Token:', process.env.TWILIO_AUTH_TOKEN ? '✓ Set' : '✗ Missing');
  console.log('- Phone Number:', process.env.TWILIO_PHONE_NUMBER);
  console.log('');

  // Test recipient (your phone number)
  const testNumber = '+94721141137'; // Change this to your phone number with country code
  
  const testMessage = 
    'PowerSense Test Message\n\n' +
    'This is a test SMS notification from PowerSense.\n\n' +
    'If you receive this, the integration is working! ✓';

  console.log(`📱 Sending test SMS to: ${testNumber}\n`);
  
  const result = await sendSMS(testNumber, testMessage);
  
  if (result.success) {
    console.log('\n✅ SUCCESS! SMS sent.');
    console.log('Message SID:', result.sid);
    console.log('\nCheck your phone!');
  } else {
    console.log('\n❌ FAILED to send SMS.');
    console.log('Error:', result.error);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you have a Twilio phone number');
    console.log('2. Verify your recipient number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    console.log('3. Check your Twilio balance');
  }
};

// Run the test
testSMS();
