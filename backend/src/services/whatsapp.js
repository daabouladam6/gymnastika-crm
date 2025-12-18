require('dotenv').config();
const twilio = require('twilio');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Initialize Twilio client (primary method)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = accountSid && authToken && accountSid !== 'your_account_sid' 
  ? twilio(accountSid, authToken) 
  : null;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM; // Format: whatsapp:+14155238886

// Initialize WhatsApp Web client (fallback method)
let whatsappWebClient = null;
let whatsappWebReady = false;

// Initialize WhatsApp Web if Twilio is not configured
if (!twilioClient && process.env.WHATSAPP_ENABLED === 'true') {
  whatsappWebClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  whatsappWebClient.on('qr', (qr) => {
    console.log('WhatsApp Web QR Code:');
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code above with your WhatsApp mobile app to connect.');
  });

  whatsappWebClient.on('ready', () => {
    console.log('WhatsApp Web client is ready!');
    whatsappWebReady = true;
  });

  whatsappWebClient.on('authenticated', () => {
    console.log('WhatsApp Web authenticated');
  });

  whatsappWebClient.on('auth_failure', (msg) => {
    console.error('WhatsApp Web authentication failure:', msg);
  });

  whatsappWebClient.on('disconnected', (reason) => {
    console.log('WhatsApp Web client disconnected:', reason);
    whatsappWebReady = false;
  });

  // Initialize WhatsApp Web client
  whatsappWebClient.initialize().catch(err => {
    console.error('Error initializing WhatsApp Web client:', err);
  });
}

/**
 * Format phone number for WhatsApp
 * @param {string} phone - Phone number
 * @returns {string} - Formatted phone number
 */
function formatPhoneNumber(phone) {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it doesn't start with country code, assume it needs one
  // For WhatsApp Web, we need the number with country code but without +
  // For Twilio, we need whatsapp:+countrycode+number format
  return cleaned;
}

/**
 * Send WhatsApp message using Twilio API
 * @param {string} to - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise} - Twilio message result
 */
async function sendViaTwilio(to, message) {
  if (!twilioClient) {
    throw new Error('Twilio client not configured');
  }

  try {
    // Format phone number for Twilio (whatsapp:+countrycode+number)
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${formatPhoneNumber(to)}`;
    
    const result = await twilioClient.messages.create({
      from: whatsappFrom,
      body: message,
      to: formattedTo
    });
    
    console.log('WhatsApp message sent via Twilio:', result.sid);
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message via Twilio:', error);
    throw error;
  }
}

/**
 * Send WhatsApp message using WhatsApp Web API
 * @param {string} to - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise} - WhatsApp Web message result
 */
async function sendViaWhatsAppWeb(to, message) {
  if (!whatsappWebClient || !whatsappWebReady) {
    throw new Error('WhatsApp Web client not ready');
  }

  try {
    // Format phone number for WhatsApp Web (countrycode+number without +)
    const formattedPhone = formatPhoneNumber(to);
    const chatId = `${formattedPhone}@c.us`;
    
    const result = await whatsappWebClient.sendMessage(chatId, message);
    
    console.log('WhatsApp message sent via WhatsApp Web:', result.id._serialized);
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message via WhatsApp Web:', error);
    throw error;
  }
}

/**
 * Send WhatsApp message (tries Twilio first, falls back to WhatsApp Web)
 * @param {string} to - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise} - Message result
 */
async function sendWhatsAppMessage(to, message) {
  // Try Twilio first if configured
  if (twilioClient) {
    try {
      return await sendViaTwilio(to, message);
    } catch (error) {
      console.log('Twilio failed, trying WhatsApp Web fallback...');
      // Fall through to WhatsApp Web
    }
  }

  // Try WhatsApp Web as fallback
  if (whatsappWebClient && whatsappWebReady) {
    try {
      return await sendViaWhatsAppWeb(to, message);
    } catch (error) {
      console.error('WhatsApp Web also failed:', error);
      throw error;
    }
  }

  // Neither method available
  console.log('WhatsApp not configured. Message would be:', message, 'to:', to);
  return Promise.resolve({ status: 'not_sent', reason: 'no_provider_configured' });
}

/**
 * Check if WhatsApp is available
 * @returns {boolean} - True if at least one method is available
 */
function isWhatsAppAvailable() {
  return !!(twilioClient || (whatsappWebClient && whatsappWebReady));
}

module.exports = { 
  sendWhatsAppMessage, 
  isWhatsAppAvailable,
  whatsappWebClient 
};

