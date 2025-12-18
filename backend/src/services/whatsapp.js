require('dotenv').config();
const axios = require('axios');

// ============================================
// META WHATSAPP CLOUD API CONFIGURATION
// ============================================

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

// Check if Meta API is configured
const isMetaConfigured = !!(PHONE_NUMBER_ID && ACCESS_TOKEN);

if (isMetaConfigured) {
  console.log('✅ Meta WhatsApp Cloud API configured');
  console.log(`   Phone Number ID: ${PHONE_NUMBER_ID}`);
} else {
  console.log('⚠️ Meta WhatsApp Cloud API not configured');
  console.log('   Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env');
}

/**
 * Format phone number for WhatsApp Cloud API
 * @param {string} phone - Phone number
 * @param {string} defaultCountryCode - Default country code to add if none present
 * @returns {string} - Formatted phone number (digits only, with country code)
 */
function formatPhoneNumber(phone, defaultCountryCode = '961') {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');
  
  // If it doesn't start with country code, add the default (Lebanon: 961)
  if (!cleaned.startsWith(defaultCountryCode) && cleaned.length <= 10) {
    cleaned = defaultCountryCode + cleaned;
  }
  
  return cleaned;
}

/**
 * Send WhatsApp message using Meta Cloud API
 * @param {string} to - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise} - API response
 */
async function sendWhatsAppMessage(to, message) {
  if (!to) {
    console.log('⚠️ No phone number provided for WhatsApp message');
    return { success: false, reason: 'no_phone_number' };
  }

  if (!isMetaConfigured) {
    console.log('⚠️ WhatsApp not configured. Message would be sent to:', to);
    console.log('   Message:', message.substring(0, 100) + (message.length > 100 ? '...' : ''));
    return { success: false, reason: 'not_configured' };
  }

  const formattedPhone = formatPhoneNumber(to);
  
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ WhatsApp message sent to ${formattedPhone}`);
    return { 
      success: true, 
      messageId: response.data.messages?.[0]?.id,
      provider: 'meta-cloud-api'
    };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error(`❌ WhatsApp send failed: ${errorMessage}`);
    
    // Log more details for debugging
    if (error.response?.data?.error) {
      console.error('   Error details:', JSON.stringify(error.response.data.error, null, 2));
    }
    
    return { 
      success: false, 
      error: errorMessage,
      details: error.response?.data?.error 
    };
  }
}

/**
 * Send WhatsApp template message (for business-initiated conversations)
 * @param {string} to - Recipient phone number
 * @param {string} templateName - Approved template name
 * @param {string} languageCode - Template language code (e.g., 'en', 'ar')
 * @param {Array} components - Template components (header, body, button variables)
 * @returns {Promise} - API response
 */
async function sendTemplateMessage(to, templateName, languageCode = 'en', components = []) {
  if (!to) {
    return { success: false, reason: 'no_phone_number' };
  }

  if (!isMetaConfigured) {
    console.log('⚠️ WhatsApp not configured. Template would be sent to:', to);
    return { success: false, reason: 'not_configured' };
  }

  const formattedPhone = formatPhoneNumber(to);
  
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        }
      }
    };

    // Add components if provided (for variable substitution)
    if (components.length > 0) {
      payload.template.components = components;
    }

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ WhatsApp template "${templateName}" sent to ${formattedPhone}`);
    return { 
      success: true, 
      messageId: response.data.messages?.[0]?.id,
      provider: 'meta-cloud-api',
      template: templateName
    };
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || error.message;
    console.error(`❌ WhatsApp template send failed: ${errorMessage}`);
    return { 
      success: false, 
      error: errorMessage,
      details: error.response?.data?.error 
    };
  }
}

/**
 * Mark a message as read
 * @param {string} messageId - The message ID to mark as read
 * @returns {Promise} - API response
 */
async function markMessageAsRead(messageId) {
  if (!isMetaConfigured) {
    return { success: false, reason: 'not_configured' };
  }

  try {
    await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get WhatsApp integration status
 * @returns {object} - Status of WhatsApp configuration
 */
function getWhatsAppStatus() {
  return {
    available: isMetaConfigured,
    provider: 'meta-cloud-api',
    configured: isMetaConfigured,
    phoneNumberId: PHONE_NUMBER_ID ? `${PHONE_NUMBER_ID.substring(0, 4)}...` : null,
    businessAccountId: BUSINESS_ACCOUNT_ID ? `${BUSINESS_ACCOUNT_ID.substring(0, 4)}...` : null
  };
}

/**
 * Check if WhatsApp is available (boolean)
 * @returns {boolean}
 */
function isWhatsAppAvailable() {
  return isMetaConfigured;
}

/**
 * Verify webhook token (for Meta webhook verification)
 * @param {string} mode - The mode from Meta
 * @param {string} token - The verify token from Meta
 * @param {string} challenge - The challenge from Meta
 * @returns {object} - Verification result
 */
function verifyWebhook(mode, token, challenge) {
  const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'gymnastika_webhook_token';
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    return { success: true, challenge };
  }
  
  console.log('❌ Webhook verification failed');
  return { success: false };
}

// ============================================
// MESSAGE TEMPLATES (Text Messages)
// ============================================

/**
 * Get trainer name from email
 */
function getTrainerNameFromEmail(trainerEmail) {
  try {
    const { getTrainerName } = require('../config/trainers');
    return getTrainerName(trainerEmail);
  } catch {
    if (!trainerEmail) return 'Your Coach';
    const name = trainerEmail.split('@')[0].replace(/[._]/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}

/**
 * Send welcome WhatsApp message to new customer
 */
async function sendWelcomeWhatsApp(phone, customerName) {
  const message = `👋 مرحباً ${customerName}!

Welcome to *Gymnastika*! 🏋️

We're excited to have you as part of our fitness community. We're here to help you achieve your health and fitness goals.

If you have any questions, feel free to reply to this message.

See you soon!
_The Gymnastika Team_`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * Send PT confirmation WhatsApp to customer
 */
async function sendPTConfirmationWhatsApp(phone, customerName, ptDate, trainerEmail = null, ptTime = null) {
  const trainerName = getTrainerNameFromEmail(trainerEmail);
  const timeStr = ptTime ? ` at *${ptTime}*` : '';
  
  const message = `✅ *Session Confirmed!*

Hi ${customerName},

Your private training session at *Gymnastika* is booked!

📅 *Date:* ${ptDate}${timeStr}
🏋️ *Coach:* ${trainerName}

*What to bring:*
• Comfortable workout clothes
• Water bottle
• Positive attitude! 💪

Please arrive a few minutes early. If you need to reschedule, contact us ASAP.

See you soon!
_The Gymnastika Team_`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * Send PT reminder WhatsApp to customer (day of session)
 */
async function sendPTReminderWhatsApp(phone, customerName, ptDate, trainerEmail = null, ptTime = null) {
  const trainerName = getTrainerNameFromEmail(trainerEmail);
  const timeStr = ptTime ? ` at *${ptTime}*` : '';
  
  const message = `⏰ *Reminder: Your Session is TODAY!*

Hi ${customerName},

Just a friendly reminder that your private training session with *${trainerName}* is TODAY${timeStr}!

📅 *Date:* ${ptDate}
🏋️ *Coach:* ${trainerName}

Don't forget:
✓ Comfortable workout clothes
✓ Water bottle
✓ Arrive a few minutes early

Let's crush those goals! 💪🔥

See you soon!
_The Gymnastika Team_`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * Send PT date change WhatsApp to customer
 */
async function sendPTDateChangeWhatsApp(phone, customerName, oldDateTime, newDateTime, trainerEmail = null) {
  const trainerName = getTrainerNameFromEmail(trainerEmail);
  
  const message = `📅 *Session Rescheduled*

Hi ${customerName},

Your session with *${trainerName}* has been rescheduled:

❌ ~${oldDateTime}~
✅ *${newDateTime}*

Please update your calendar. If you have any questions, let us know!

_The Gymnastika Team_`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * Send PT cancellation WhatsApp to customer
 */
async function sendPTCancellationWhatsApp(phone, customerName, ptDateTime, trainerEmail = null) {
  const trainerName = getTrainerNameFromEmail(trainerEmail);
  
  const message = `❌ *Session Cancelled*

Hi ${customerName},

Your session with *${trainerName}* scheduled for *${ptDateTime}* has been cancelled.

If you didn't request this cancellation or would like to reschedule, please contact us.

We hope to see you soon!
_The Gymnastika Team_`;

  return sendWhatsAppMessage(phone, message);
}

/**
 * Send PT confirmation WhatsApp to trainer
 */
async function sendTrainerConfirmationWhatsApp(trainerPhone, clientName, ptDate, clientEmail, clientPhone, ptTime = null) {
  const timeStr = ptTime ? ` at *${ptTime}*` : '';
  
  const message = `📋 *New Session Scheduled*

A new private session has been booked!

👤 *Client:* ${clientName}
📅 *Date:* ${ptDate}${timeStr}
📱 *Phone:* ${clientPhone || 'Not provided'}
${clientEmail ? `📧 *Email:* ${clientEmail}` : ''}

Please prepare for this session!
_Gymnastika_`;

  return sendWhatsAppMessage(trainerPhone, message);
}

/**
 * Send PT reminder WhatsApp to trainer (day of session)
 */
async function sendTrainerReminderWhatsApp(trainerPhone, clientName, ptDate, clientEmail, clientPhone, ptTime = null) {
  const timeStr = ptTime ? ` at *${ptTime}*` : '';
  
  const message = `⏰ *Session TODAY${timeStr}!*

You have a session with *${clientName}* today!

👤 *Client:* ${clientName}
📅 *Date:* ${ptDate}
📱 *Phone:* ${clientPhone || 'Not provided'}
${clientEmail ? `📧 *Email:* ${clientEmail}` : ''}

Have a great session! 💪
_Gymnastika_`;

  return sendWhatsAppMessage(trainerPhone, message);
}

/**
 * Send PT date change WhatsApp to trainer
 */
async function sendTrainerDateChangeWhatsApp(trainerPhone, clientName, oldDateTime, newDateTime, clientEmail, clientPhone) {
  const message = `📅 *Client Session Rescheduled*

Session with *${clientName}* has been changed:

❌ ~${oldDateTime}~
✅ *${newDateTime}*

👤 *Client:* ${clientName}
📱 *Phone:* ${clientPhone || 'Not provided'}
${clientEmail ? `📧 *Email:* ${clientEmail}` : ''}

Please update your schedule.
_Gymnastika_`;

  return sendWhatsAppMessage(trainerPhone, message);
}

/**
 * Send PT cancellation WhatsApp to trainer
 */
async function sendTrainerCancellationWhatsApp(trainerPhone, clientName, ptDateTime, clientEmail, clientPhone) {
  const message = `❌ *Session Cancelled*

Session with *${clientName}* for *${ptDateTime}* has been cancelled.

👤 *Client:* ${clientName}
📱 *Phone:* ${clientPhone || 'Not provided'}
${clientEmail ? `📧 *Email:* ${clientEmail}` : ''}

This time slot is now available.
_Gymnastika_`;

  return sendWhatsAppMessage(trainerPhone, message);
}

/**
 * Send general reminder WhatsApp
 */
async function sendReminderWhatsApp(phone, customerName, reminderType, reminderDate, notes = '') {
  const typeDisplay = reminderType.replace('_', ' ').toUpperCase();
  
  const message = `📌 *Reminder: ${typeDisplay}*

Hi ${customerName},

This is a reminder for: *${typeDisplay}*
📅 *Date:* ${reminderDate}
${notes ? `📝 *Notes:* ${notes}` : ''}

_The Gymnastika Team_`;

  return sendWhatsAppMessage(phone, message);
}

module.exports = { 
  // Core functions
  sendWhatsAppMessage, 
  sendTemplateMessage,
  markMessageAsRead,
  isWhatsAppAvailable,
  getWhatsAppStatus,
  verifyWebhook,
  formatPhoneNumber,
  
  // Customer messages
  sendWelcomeWhatsApp,
  sendPTConfirmationWhatsApp,
  sendPTReminderWhatsApp,
  sendPTDateChangeWhatsApp,
  sendPTCancellationWhatsApp,
  
  // Trainer messages
  sendTrainerConfirmationWhatsApp,
  sendTrainerReminderWhatsApp,
  sendTrainerDateChangeWhatsApp,
  sendTrainerCancellationWhatsApp,
  
  // General
  sendReminderWhatsApp
};
