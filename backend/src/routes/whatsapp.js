const express = require('express');
const router = express.Router();
const { 
  getWhatsAppStatus, 
  sendWhatsAppMessage,
  sendTemplateMessage,
  verifyWebhook,
  markMessageAsRead,
  formatPhoneNumber 
} = require('../services/whatsapp');
const db = require('../../database/db');

/**
 * GET /api/whatsapp/status
 * Get WhatsApp integration status
 */
router.get('/status', (req, res) => {
  const status = getWhatsAppStatus();
  res.json({
    success: true,
    ...status
  });
});

/**
 * POST /api/whatsapp/send
 * Send a WhatsApp message
 * Body: { phone, message }
 */
router.post('/send', async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'Phone and message are required'
    });
  }

  try {
    const result = await sendWhatsAppMessage(phone, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/send-template
 * Send a WhatsApp template message
 * Body: { phone, templateName, languageCode, components }
 */
router.post('/send-template', async (req, res) => {
  const { phone, templateName, languageCode = 'en', components = [] } = req.body;

  if (!phone || !templateName) {
    return res.status(400).json({
      success: false,
      error: 'Phone and templateName are required'
    });
  }

  try {
    const result = await sendTemplateMessage(phone, templateName, languageCode, components);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/send-to-customer/:id
 * Send a custom WhatsApp message to a specific customer
 * Body: { message }
 */
router.post('/send-to-customer/:id', async (req, res) => {
  const { message } = req.body;
  const customerId = req.params.id;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  db.get('SELECT * FROM customers WHERE id = ?', [customerId], async (err, customer) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    if (!customer.phone) {
      return res.status(400).json({ success: false, error: 'Customer has no phone number' });
    }

    try {
      const result = await sendWhatsAppMessage(customer.phone, message);
      res.json({
        ...result,
        customer: { id: customer.id, name: customer.name, phone: customer.phone }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

/**
 * POST /api/whatsapp/broadcast
 * Send WhatsApp message to multiple customers
 * Body: { customerIds: number[], message: string } OR { customerType: 'all' | 'pt' | 'basic', message: string }
 */
router.post('/broadcast', async (req, res) => {
  const { customerIds, customerType, message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  let query;
  let params = [];

  if (customerIds && Array.isArray(customerIds) && customerIds.length > 0) {
    const placeholders = customerIds.map(() => '?').join(',');
    query = `SELECT * FROM customers WHERE id IN (${placeholders}) AND phone IS NOT NULL AND (archived = 0 OR archived IS NULL)`;
    params = customerIds;
  } else if (customerType) {
    if (customerType === 'all') {
      query = 'SELECT * FROM customers WHERE phone IS NOT NULL AND (archived = 0 OR archived IS NULL)';
    } else {
      query = 'SELECT * FROM customers WHERE customer_type = ? AND phone IS NOT NULL AND (archived = 0 OR archived IS NULL)';
      params = [customerType];
    }
  } else {
    return res.status(400).json({
      success: false,
      error: 'Either customerIds or customerType is required'
    });
  }

  db.all(query, params, async (err, customers) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    if (customers.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No customers found with phone numbers' 
      });
    }

    const results = {
      total: customers.length,
      sent: 0,
      failed: 0,
      details: []
    };

    for (const customer of customers) {
      try {
        // Personalize message with customer name
        const personalizedMessage = message.replace(/\{name\}/gi, customer.name);
        const result = await sendWhatsAppMessage(customer.phone, personalizedMessage);
        
        if (result.success) {
          results.sent++;
          results.details.push({
            customerId: customer.id,
            name: customer.name,
            phone: customer.phone,
            status: 'sent',
            messageId: result.messageId
          });
        } else {
          results.failed++;
          results.details.push({
            customerId: customer.id,
            name: customer.name,
            phone: customer.phone,
            status: 'failed',
            reason: result.error || result.reason
          });
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          customerId: customer.id,
          name: customer.name,
          phone: customer.phone,
          status: 'error',
          error: error.message
        });
      }

      // Delay between messages to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.json({
      success: true,
      ...results
    });
  });
});

/**
 * GET /api/whatsapp/webhook
 * Webhook verification endpoint for Meta
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const result = verifyWebhook(mode, token, challenge);
  
  if (result.success) {
    res.status(200).send(result.challenge);
  } else {
    res.status(403).send('Verification failed');
  }
});

/**
 * POST /api/whatsapp/webhook
 * Webhook endpoint for receiving WhatsApp messages and status updates
 */
router.post('/webhook', async (req, res) => {
  const body = req.body;

  // Check if this is a WhatsApp status update or message
  if (body.object === 'whatsapp_business_account') {
    const entries = body.entry || [];
    
    for (const entry of entries) {
      const changes = entry.changes || [];
      
      for (const change of changes) {
        const value = change.value;
        
        // Handle incoming messages
        if (value.messages) {
          for (const message of value.messages) {
            console.log('📩 Incoming WhatsApp message:');
            console.log('   From:', message.from);
            console.log('   Type:', message.type);
            
            if (message.type === 'text') {
              console.log('   Text:', message.text?.body);
            }
            
            // Mark message as read
            if (message.id) {
              await markMessageAsRead(message.id);
            }
            
            // TODO: You can add custom logic here to:
            // - Store messages in database
            // - Auto-reply to customers
            // - Trigger notifications
          }
        }
        
        // Handle message status updates (sent, delivered, read)
        if (value.statuses) {
          for (const status of value.statuses) {
            console.log('📊 Message status update:');
            console.log('   ID:', status.id);
            console.log('   Status:', status.status);
            console.log('   Recipient:', status.recipient_id);
          }
        }
      }
    }
    
    // Always respond with 200 OK to acknowledge receipt
    res.status(200).send('OK');
  } else {
    res.status(404).send('Not found');
  }
});

/**
 * GET /api/whatsapp/test/:phone
 * Send a test message to verify WhatsApp is working
 */
router.get('/test/:phone', async (req, res) => {
  const { phone } = req.params;
  
  const testMessage = `✅ *WhatsApp Test Message*

This is a test message from Gymnastika CRM.

If you received this message, WhatsApp integration is working correctly! 🎉

_Sent at: ${new Date().toLocaleString()}_`;

  try {
    const result = await sendWhatsAppMessage(phone, testMessage);
    res.json({
      message: result.success ? 'Test message sent' : 'Test message failed',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
