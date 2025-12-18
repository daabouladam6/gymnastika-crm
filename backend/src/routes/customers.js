const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { sendWelcomeEmail, sendPTConfirmationEmail, sendPTReminderEmail, sendTrainerConfirmationEmail, sendTrainerReminderEmail, sendPTDateChangeEmail, sendTrainerDateChangeEmail, sendPTCancellationEmail, sendTrainerCancellationEmail } = require('../services/email');

// Helper function to check if a date is today
function isToday(dateString) {
  const today = new Date();
  const ptDate = new Date(dateString);
  return today.toDateString() === ptDate.toDateString();
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
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const customerId = this.lastID;
      
      // Send emails for PT customers
      if (customer_type === 'pt' && pt_date) {
        // Send emails to CUSTOMER (if they have email)
        if (email) {
          // 1. Confirmation email to customer (includes trainer name and time)
          sendPTConfirmationEmail(email, name, pt_date, trainer_email, pt_time)
            .then(() => {
              console.log(`✓ PT CONFIRMATION email sent to CUSTOMER ${name} (${email}) for session on ${pt_date}${pt_time ? ' at ' + pt_time : ''}`);
            })
            .catch(err => {
              console.error(`✗ Failed to send PT confirmation email to customer ${name} (${email}):`, err.message);
            });
          
          // 2. Reminder email to customer (if PT date is TODAY) - includes trainer name and time
          if (isToday(pt_date)) {
            setTimeout(() => {
              sendPTReminderEmail(email, name, pt_date, trainer_email, pt_time)
                .then(() => {
                  console.log(`✓ PT REMINDER email sent to CUSTOMER ${name} (${email}) - session is TODAY!`);
                })
                .catch(err => {
                  console.error(`✗ Failed to send PT reminder email to customer ${name} (${email}):`, err.message);
                });
            }, 2000);
          }
        }

        // Send emails to TRAINER
        if (trainer_email) {
          // 1. Confirmation email to trainer (includes time)
          sendTrainerConfirmationEmail(trainer_email, name, pt_date, email, phone, pt_time)
            .then(() => {
              console.log(`✓ PT CONFIRMATION email sent to TRAINER (${trainer_email}) about client ${name} for session on ${pt_date}${pt_time ? ' at ' + pt_time : ''}`);
            })
            .catch(err => {
              console.error(`✗ Failed to send PT confirmation email to trainer (${trainer_email}):`, err.message);
            });
          
          // 2. Reminder email to trainer (if PT date is TODAY) - includes time
          if (isToday(pt_date)) {
            setTimeout(() => {
              sendTrainerReminderEmail(trainer_email, name, pt_date, email, phone, pt_time)
                .then(() => {
                  console.log(`✓ PT REMINDER email sent to TRAINER (${trainer_email}) about client ${name} - session is TODAY!`);
                })
                .catch(err => {
                  console.error(`✗ Failed to send PT reminder email to trainer (${trainer_email}):`, err.message);
                });
            }, 2000);
          }
        }
      } else if (email) {
        // Basic customers get the welcome email
        sendWelcomeEmail(email, name)
          .then(() => {
            console.log(`✓ Welcome email sent to ${name} (${email})`);
          })
          .catch(err => {
            console.error(`✗ Failed to send welcome email to ${name} (${email}):`, err.message);
          });
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
      function(updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Customer not found' });
        }
        
        // If PT date or time changed, send notification emails
        if (dateOrTimeChanged) {
          const customerEmail = email || oldCustomer.email;
          const trainerEmailAddr = trainer_email || oldCustomer.trainer_email;
          const customerName = name || oldCustomer.name;
          const customerPhone = phone || oldCustomer.phone;
          
          // Format old and new datetime for display
          const oldDateTime = oldPtTime ? `${oldPtDate} at ${oldPtTime}` : oldPtDate;
          const newDateTime = newPtTime ? `${newPtDate} at ${newPtTime}` : newPtDate;
          
          // Send date change email to customer (includes trainer name and time)
          if (customerEmail) {
            sendPTDateChangeEmail(customerEmail, customerName, oldDateTime, newDateTime, trainerEmailAddr)
              .then(() => {
                console.log(`✓ PT DATE CHANGE email sent to CUSTOMER ${customerName} (${customerEmail}): ${oldDateTime} → ${newDateTime}`);
              })
              .catch(err => {
                console.error(`✗ Failed to send date change email to customer ${customerName}:`, err.message);
              });
          }
          
          // Send date change email to trainer
          if (trainerEmailAddr) {
            sendTrainerDateChangeEmail(trainerEmailAddr, customerName, oldDateTime, newDateTime, customerEmail, customerPhone)
              .then(() => {
                console.log(`✓ PT DATE CHANGE email sent to TRAINER (${trainerEmailAddr}) about client ${customerName}: ${oldDateTime} → ${newDateTime}`);
              })
              .catch(err => {
                console.error(`✗ Failed to send date change email to trainer:`, err.message);
              });
          }
        }
        
        res.json({ message: 'Customer updated successfully' });
      }
    );
  });
});

// Archive customer (soft delete)
router.delete('/:id', (req, res) => {
  // First, get customer info for sending cancellation emails (if PT customer)
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
      function(archiveErr) {
        if (archiveErr) {
          return res.status(500).json({ error: archiveErr.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Send cancellation emails for PT customers
        if (customer.customer_type === 'pt' && customer.pt_date) {
          // Format datetime for display
          const ptDateTime = customer.pt_time ? `${customer.pt_date} at ${customer.pt_time}` : customer.pt_date;
          
          // Send cancellation email to customer (includes trainer name and time)
          if (customer.email) {
            sendPTCancellationEmail(customer.email, customer.name, ptDateTime, customer.trainer_email)
              .then(() => {
                console.log(`✓ PT CANCELLATION email sent to CUSTOMER ${customer.name} (${customer.email})`);
              })
              .catch(err => {
                console.error(`✗ Failed to send cancellation email to customer ${customer.name}:`, err.message);
              });
          }
          
          // Send cancellation email to trainer (includes time)
          if (customer.trainer_email) {
            sendTrainerCancellationEmail(customer.trainer_email, customer.name, ptDateTime, customer.email, customer.phone)
              .then(() => {
                console.log(`✓ PT CANCELLATION email sent to TRAINER (${customer.trainer_email}) about client ${customer.name}`);
              })
              .catch(err => {
                console.error(`✗ Failed to send cancellation email to trainer:`, err.message);
              });
          }
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

