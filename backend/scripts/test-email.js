require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { sendWelcomeEmail, sendPTConfirmationEmail } = require('../src/services/email');

async function testEmail() {
  console.log('=== Testing Email Configuration ===\n');
  
  console.log('Environment Variables:');
  console.log('  SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('  SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('  SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
  console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***SET***' : 'NOT SET');
  console.log('  SMTP_FROM:', process.env.SMTP_FROM || 'NOT SET');
  console.log('  SMTP_FROM_NAME:', process.env.SMTP_FROM_NAME || 'NOT SET');
  console.log('');

  // Test email - use your own email for testing
  const testEmail = process.env.SMTP_USER || 'Gymnastika.lb@gmail.com';
  
  console.log(`Testing welcome email to: ${testEmail}\n`);
  
  try {
    await sendWelcomeEmail(testEmail, 'Test Customer');
    console.log('✓ Welcome email test: SUCCESS\n');
  } catch (error) {
    console.error('✗ Welcome email test: FAILED');
    console.error('Error:', error.message);
    console.error('Full error:', error);
    console.log('');
  }

  console.log('Waiting 2 seconds before next test...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    await sendPTConfirmationEmail(testEmail, 'Test PT Customer', '2024-02-15');
    console.log('✓ PT confirmation email test: SUCCESS\n');
  } catch (error) {
    console.error('✗ PT confirmation email test: FAILED');
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }

  console.log('\n=== Test Complete ===');
  console.log('Check your inbox (and spam folder) for test emails.');
  process.exit(0);
}

testEmail();

