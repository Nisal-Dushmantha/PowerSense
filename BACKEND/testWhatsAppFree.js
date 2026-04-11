require('dotenv').config();
const { sendWhatsAppViaCallMeBot } = require('./services/whatsappServiceFree');

// Test sending a WhatsApp message via CallMeBot (FREE)
const testWhatsAppFree = async () => {
  console.log('🧪 Testing FREE WhatsApp message via CallMeBot...\n');
  
  const apiKey = process.env.CALLMEBOT_API_KEY;
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.log('❌ ERROR: CALLMEBOT_API_KEY not configured in .env\n');
    console.log('📱 To get your API key:');
    console.log('1. Open WhatsApp');
    console.log('2. Send this message to +34 644 41 88 77:');
    console.log('   "I allow callmebot to send me messages"');
    console.log('3. You will receive your API key in the reply');
    console.log('4. Add it to your .env file as CALLMEBOT_API_KEY=xxxxx\n');
    return;
  }

  console.log('✓ API Key configured:', apiKey.substring(0, 5) + '...\n');

  // Your phone number (without + or spaces, just digits)
  const phoneNumber = '94769823540'; // Change if needed
  
  const testMessage = 
    '⚡ PowerSense Test Message\n\n' +
    'This is a FREE test WhatsApp notification from PowerSense.\n\n' +
    'If you receive this, the integration is working! ✅';

  console.log(`📱 Sending test message to: +${phoneNumber}\n`);
  
  const result = await sendWhatsAppViaCallMeBot(phoneNumber, apiKey, testMessage);
  
  if (result.success) {
    console.log('\n✅ SUCCESS! Message sent.');
    console.log('Check your WhatsApp!');
  } else {
    console.log('\n❌ FAILED to send message.');
    console.log('Error:', result.error);
  }
};

// Run the test
testWhatsAppFree();
