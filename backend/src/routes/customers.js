const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { 
  sendWelcomeEmail, 
  sendPTConfirmationEmail, 
  sendPTReminderEmail, 
  sendTrainerConfirmationEmail, 
  sendTrainerReminderEmail, 
  sendPTDateChangeEmail, 
  sendTrainerDateChangeEmail, 
  sendPTCancellationEmail, 
  sendTrainerCancellationEmail 
} = require('../services/email');
const { 
  sendWelcomeWhatsApp,
  sendPTConfirmationWhatsApp,
  sendPTReminderWhatsApp,
  sendTrainerConfirmationWhatsApp,
  sendTrainerReminderWhatsApp,
  sendPTDateChangeWhatsApp,
  sendTrainerDateChangeWhatsApp,
  sendPTCancellationWhatsApp,
  sendTrainerCancellationWhatsApp,
  isWhatsAppAvailable
} = require('../services/whatsapp');

// Helper function to check if a date is today
function isToday(dateString) {
  const today = new Date();
  const ptDate = new Date(dateString);
  return today.toDateString() === ptDate.toDateString();
}

/**
 * Send notifications to customer (email + WhatsApp)
 */
async function notifyCustomer(type, customer, options = {}) {
  const { email, phone, name } = customer;
  const { ptDate, ptTime, trainerEmail, oldDateTime, newDateTime } = options;
  
  const results = { email: null, whatsapp: null };
  
  switch (type) {
    case 'welcome':
      if (email) {
        try {
          await sendWelcomeEmail(email, name);
          results.email = 'sent';
          console.log(`✓ Welcome EMAIL sent to ${name} (${email})`);
        } catch (err) {
          results.email = 'failed';
          console.error(`✗ Welcome email failed for ${name}:`, err.message);
        }
      }
      if (phone && isWhatsAppAvailable()) {
        try {
          await sendWelcomeWhatsApp(phone, name);
          results.whatsapp = 'sent';
          console.log(`✓ Welcome WHATSAPP sent to ${name} (${phone})`);
        } catch (err) {
          results.whatsapp = 'failed';
          console.error(`✗ Welcome WhatsApp failed for ${name}:`, err.message);
        }
      }
      break;
      
    case 'pt_confirmation':
      if (email) {
        try {
          await sendPTConfirmationEmail(email, name, ptDate, trainerEmail, ptTime);
          results.email = 'sent';
          console.log(`✓ PT Confirmation EMAIL sent to ${name}`);
        } catch (err) {
          results.email = 'failed';
          console.error(`✗ PT confirmation email failed:`, err.message);
        }
      }
      if (phone && isWhatsAppAvailable()) {
        try {
          await sendPTConfirmationWhatsApp(phone, name, ptDate, trainerEmail, ptTime);
          results.whatsapp = 'sent';
          console.log(`✓ PT Confirmation WHATSAPP sent to ${name}`);
        } catch (err) {
          results.whatsapp = 'failed';
          console.error(`✗ PT confirmation WhatsApp failed:`, err.message);
        }
      }
      break;
      
    case 'pt_reminder':
      if (email) {
        try {
          await sendPTReminderEmail(email, name, ptDate, trainerEmail, ptTime);
          results.email = 'sent';
          console.log(`✓ PT Reminder EMAIL sent to ${name}`);
        } catch (err) {
          results.email = 'failed';
          console.error(`✗ PT reminder email failed:`, err.message);
        }
      }
      if (phone && isWhatsAppAvailable()) {
        try {
          await sendPTReminderWhatsApp(phone, name, ptDate, trainerEmail, ptTime);
          results.whatsapp = 'sent';
          console.log(`✓ PT Reminder WHATSAPP sent to ${name}`);
        } catch (err) {
          results.whatsapp = 'failed';
          console.error(`✗ PT reminder WhatsApp failed:`, err.message);
        }
      }
      break;
      
    case 'pt_date_change':
      if (email) {
        try {
          await sendPTDateChangeEmail(email, name, oldDateTime, newDateTime, trainerEmail);
          results.email = 'sent';
          console.log(`✓ Date Change EMAIL sent to ${name}`);
        } catch (err) {
          results.email = 'failed';
          console.error(`✗ Date change email failed:`, err.message);
        }
      }
      if (phone && isWhatsAppAvailable()) {
        try {
          await sendPTDateChangeWhatsApp(phone, name, oldDateTime, newDateTime, trainerEmail);
          results.whatsapp = 'sent';
          console.log(`✓ Date Change WHATSAPP sent to ${name}`);
        } catch (err) {
          results.whatsapp = 'failed';
          console.error(`✗ Date change WhatsApp failed:`, err.message);
        }
      }
      break;
      
    case 'pt_cancellation':
      if (email) {
        try {
          await sendPTCancellationEmail(email, name, oldDateTime, trainerEmail);
          results.email = 'sent';
          console.log(`✓ Cancellation EMAIL sent to ${name}`);
        } catch (err) {
          results.email = 'failed';
          console.error(`✗ Cancellation email failed:`, err.message);
        }
      }
      if (phone && isWhatsAppAvailable()) {
        try {
          await sendPTCancellationWhatsApp(phone, name, oldDateTime, trainerEmail);
          results.whatsapp = 'sent';
          console.log(`✓ Cancellation WHATSAPP sent to ${name}`);
        } catch (err) {
          results.whatsapp = 'failed';
          console.error(`✗ Cancellation WhatsApp failed:`, err.message);
        }
      }
      break;
  }
  
  return results;
}

/**
 * Send notifications to trainer (email + WhatsApp if configured)
 */
async function notifyTrainer(type, trainerEmail, customer, options = {}) {
  const { email, phone, name } = customer;
  const { ptDate, ptTime, oldDateTime, newDateTime } = options;
  
  if (!trainerEmail) return { email: null };
  
  const results = { email: null };
  
  switch (type) {
    case 'pt_confirmation':
      try {
        await sendTrainerConfirmationEmail(trainerEmail, name, ptDate, email, phone, ptTime);
        results.email = 'sent';
        console.log(`✓ Trainer Confirmation EMAIL sent to ${trainerEmail}`);
      } catch (err) {
        results.email = 'failed';
        console.error(`✗ Trainer confirmation email failed:`, err.message);
      }
      break;
      
    case 'pt_reminder':
      try {
        await sendTrainerReminderEmail(trainerEmail, name, ptDate, email, phone, ptTime);
        results.email = 'sent';
        console.log(`✓ Trainer Reminder EMAIL sent to ${trainerEmail}`);
      } catch (err) {
        results.email = 'failed';
        console.error(`✗ Trainer reminder email failed:`, err.message);
      }
      break;
      
    case 'pt_date_change':
      try {
        await sendTrainerDateChangeEmail(trainerEmail, name, oldDateTime, newDateTime, email, phone);
        results.email = 'sent';
        console.log(`✓ Trainer Date Change EMAIL sent to ${trainerEmail}`);
      } catch (err) {
        results.email = 'failed';
        console.error(`✗ Trainer date change email failed:`, err.message);
      }
      break;
      
    case 'pt_cancellation':
      try {
        await sendTrainerCancellationEmail(trainerEmail, name, oldDateTime, email, phone);
        results.email = 'sent';
        console.log(`✓ Trainer Cancellation EMAIL sent to ${trainerEmail}`);
      } catch (err) {
        results.email = 'failed';
        console.error(`✗ Trainer cancellation email failed:`, err.message);
      }
      break;
  }
  
  return results;
}

// Get all customers (excluding archived)
router.get('/', (req, res) => {
  const { type } = req.query; // Filter by customer_type: 'basic' or 'pt'
  
  let query = 'SELECT * FROM customers WHERE (archived = 0 OR archived IS NULL)';
  const params = [];
  
  if (type) {
    query += ' AND customer_type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get PT customers only (excluding archived)
router.get('/pt', (req, res) => {
  db.all('SELECT * FROM customers WHERE customer_type = ? AND (archived = 0 OR archived IS NULL) ORDER BY pt_date ASC', ['pt'], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get basic customers only (excluding archived)
router.get('/basic', (req, res) => {
  db.all('SELECT * FROM customers WHERE customer_type = ? AND (archived = 0 OR archived IS NULL) ORDER BY created_at DESC', ['basic'], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get archived customers with sorting
router.get('/archived', (req, res) => {
  const { sort } = req.query; // 'newest' or 'oldest'
  const orderBy = sort === 'oldest' ? 'ASC' : 'DESC';
  
  db.all(`SELECT * FROM customers WHERE archived = 1 ORDER BY archived_at ${orderBy}`, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single customer
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(row);
  });
});

// Create customer
router.post('/', async (req, res) => {
  const { name, phone, email, child_name, referral_source, notes, wants_pt, customer_type, pt_date, pt_time, trainer_email } = req.body;
  
  // Validate required fields
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  // If PT customer, validate pt_date and trainer_email
  if (customer_type === 'pt') {
    if (!pt_date) {
      return res.status(400).json({ error: 'PT date is required for PT customers' });
    }
    if (!trainer_email) {
      return res.status(400).json({ error: 'Trainer selection is required for PT customers' });
    }
  }
  
  db.run(
    'INSERT INTO customers (name, phone, email, child_name, referral_source, notes, wants_pt, customer_type, pt_date, pt_time, trainer_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, phone, email || null, child_name || null, referral_source || null, notes || null, wants_pt ? 1 : 0, customer_type || 'basic', pt_date || null, pt_time || null, trainer_email || null],
    async function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const customerId = this.lastID;
      const customer = { name, email, phone };
      
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📝 New Customer Created: ${name}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      
      // Send notifications for PT customers
      if (customer_type === 'pt' && pt_date) {
        // Send confirmation to customer
        await notifyCustomer('pt_confirmation', customer, { ptDate: pt_date, ptTime: pt_time, trainerEmail: trainer_email });
        
        // Send confirmation to trainer
        await notifyTrainer('pt_confirmation', trainer_email, customer, { ptDate: pt_date, ptTime: pt_time });
        
        // If PT date is TODAY, also send reminder
        if (isToday(pt_date)) {
          setTimeout(async () => {
            await notifyCustomer('pt_reminder', customer, { ptDate: pt_date, ptTime: pt_time, trainerEmail: trainer_email });
            await notifyTrainer('pt_reminder', trainer_email, customer, { ptDate: pt_date, ptTime: pt_time });
          }, 2000);
        }
      } else {
        // Basic customers get the welcome message
        await notifyCustomer('welcome', customer);
      }
      
      res.status(201).json({ 
        id: customerId, 
        message: 'Customer created successfully'
      });
    }
  );
});

// Update customer
router.put('/:id', (req, res) => {
  const { name, phone, email, child_name, referral_source, notes, wants_pt, customer_type, pt_date, pt_time, trainer_email } = req.body;
  
  // Validate required fields
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  // If PT customer, validate pt_date
  if (customer_type === 'pt' && !pt_date) {
    return res.status(400).json({ error: 'PT date is required for PT customers' });
  }
  
  // First, get the current customer data to check if PT date/time changed
  db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, oldCustomer) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!oldCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Check if PT date or time has changed
    const oldPtDate = oldCustomer.pt_date;
    const oldPtTime = oldCustomer.pt_time;
    const newPtDate = pt_date;
    const newPtTime = pt_time;
    const dateOrTimeChanged = customer_type === 'pt' && oldPtDate && newPtDate && (oldPtDate !== newPtDate || oldPtTime !== newPtTime);
    
    // Perform the update
    db.run(
      'UPDATE customers SET name = ?, phone = ?, email = ?, child_name = ?, referral_source = ?, notes = ?, wants_pt = ?, customer_type = ?, pt_date = ?, pt_time = ?, trainer_email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, phone, email || null, child_name || null, referral_source || null, notes || null, wants_pt ? 1 : 0, customer_type || 'basic', pt_date || null, pt_time || null, trainer_email || null, req.params.id],
      async function(updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Customer not found' });
        }
        
        // If PT date or time changed, send notification
        if (dateOrTimeChanged) {
          console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`📅 PT Session Rescheduled: ${name}`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          
          const customerEmail = email || oldCustomer.email;
          const customerPhone = phone || oldCustomer.phone;
          const trainerEmailAddr = trainer_email || oldCustomer.trainer_email;
          const customerName = name || oldCustomer.name;
          
          // Format old and new datetime for display
          const oldDateTime = oldPtTime ? `${oldPtDate} at ${oldPtTime}` : oldPtDate;
          const newDateTime = newPtTime ? `${newPtDate} at ${newPtTime}` : newPtDate;
          
          const customer = { name: customerName, email: customerEmail, phone: customerPhone };
          
          // Notify customer
          await notifyCustomer('pt_date_change', customer, { oldDateTime, newDateTime, trainerEmail: trainerEmailAddr });
          
          // Notify trainer
          await notifyTrainer('pt_date_change', trainerEmailAddr, customer, { oldDateTime, newDateTime });
        }
        
        res.json({ message: 'Customer updated successfully' });
      }
    );
  });
});

// Archive customer (soft delete)
router.delete('/:id', (req, res) => {
  // First, get customer info for sending cancellation notifications
  db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, customer) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Archive the customer instead of deleting
    db.run(
      'UPDATE customers SET archived = 1, archived_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.params.id],
      async function(archiveErr) {
        if (archiveErr) {
          return res.status(500).json({ error: archiveErr.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Send cancellation notifications for PT customers
        if (customer.customer_type === 'pt' && customer.pt_date) {
          console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`❌ PT Session Cancelled: ${customer.name}`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          
          // Format datetime for display
          const ptDateTime = customer.pt_time ? `${customer.pt_date} at ${customer.pt_time}` : customer.pt_date;
          
          const customerData = { 
            name: customer.name, 
            email: customer.email, 
            phone: customer.phone 
          };
          
          // Notify customer
          await notifyCustomer('pt_cancellation', customerData, { 
            oldDateTime: ptDateTime, 
            trainerEmail: customer.trainer_email 
          });
          
          // Notify trainer
          await notifyTrainer('pt_cancellation', customer.trainer_email, customerData, { 
            oldDateTime: ptDateTime 
          });
        }
        
        res.json({ message: 'Customer archived successfully' });
      }
    );
  });
});

// Restore archived customer
router.put('/:id/restore', (req, res) => {
  db.run(
    'UPDATE customers SET archived = 0, archived_at = NULL WHERE id = ?',
    [req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      res.json({ message: 'Customer restored successfully' });
    }
  );
});

// Permanently delete archived customer
router.delete('/:id/permanent', (req, res) => {
  // First check if customer is archived
  db.get('SELECT * FROM customers WHERE id = ? AND archived = 1', [req.params.id], (err, customer) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!customer) {
      return res.status(404).json({ error: 'Archived customer not found' });
    }
    
    // Delete associated reminders
    db.run('DELETE FROM reminders WHERE customer_id = ?', [req.params.id], (reminderErr) => {
      if (reminderErr) {
        return res.status(500).json({ error: reminderErr.message });
      }
      
      // Permanently delete the customer
      db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function(deleteErr) {
        if (deleteErr) {
          return res.status(500).json({ error: deleteErr.message });
        }
        res.json({ message: 'Customer permanently deleted' });
      });
    });
  });
});

module.exports = router;
