const express = require('express');
const router = express.Router();
const db = require('../../database/db');

// Get all reminders with customer info
router.get('/', (req, res) => {
  const query = `
    SELECT r.*, c.name as customer_name, c.phone as customer_phone 
    FROM reminders r
    JOIN customers c ON r.customer_id = c.id
    ORDER BY r.reminder_date ASC, r.created_at DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get reminders due today or overdue (pending only)
router.get('/due', (req, res) => {
  const query = `
    SELECT r.*, c.name as customer_name, c.phone as customer_phone 
    FROM reminders r
    JOIN customers c ON r.customer_id = c.id
    WHERE r.reminder_date <= date('now') AND r.completed = 0
    ORDER BY r.reminder_date ASC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get all pending reminders (not completed, including future)
router.get('/pending', (req, res) => {
  const query = `
    SELECT r.*, c.name as customer_name, c.phone as customer_phone 
    FROM reminders r
    JOIN customers c ON r.customer_id = c.id
    WHERE r.completed = 0
    ORDER BY r.reminder_date ASC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get completed reminders
router.get('/completed', (req, res) => {
  const query = `
    SELECT r.*, c.name as customer_name, c.phone as customer_phone 
    FROM reminders r
    JOIN customers c ON r.customer_id = c.id
    WHERE r.completed = 1
    ORDER BY r.reminder_date DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get reminders for a specific customer
router.get('/customer/:customerId', (req, res) => {
  const query = `
    SELECT r.*, c.name as customer_name, c.phone as customer_phone 
    FROM reminders r
    JOIN customers c ON r.customer_id = c.id
    WHERE r.customer_id = ?
    ORDER BY r.reminder_date ASC
  `;
  
  db.all(query, [req.params.customerId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create reminder
router.post('/', (req, res) => {
  const { customer_id, reminder_date, reminder_type, notes } = req.body;
  
  // Validate required fields
  if (!customer_id || !reminder_date) {
    return res.status(400).json({ error: 'Customer ID and reminder date are required' });
  }
  
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(reminder_date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }
  
  // Check if customer exists
  db.get('SELECT id FROM customers WHERE id = ?', [customer_id], (err, customer) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Create reminder
    db.run(
      'INSERT INTO reminders (customer_id, reminder_date, reminder_type, notes) VALUES (?, ?, ?, ?)',
      [customer_id, reminder_date, reminder_type || 'follow_up', notes || null],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ 
          id: this.lastID, 
          message: 'Reminder created successfully' 
        });
      }
    );
  });
});

// Mark reminder as completed
router.put('/:id/complete', (req, res) => {
  db.run(
    'UPDATE reminders SET completed = 1 WHERE id = ?',
    [req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Reminder not found' });
      }
      res.json({ message: 'Reminder marked as completed' });
    }
  );
});

// Update reminder
router.put('/:id', (req, res) => {
  const { reminder_date, reminder_type, notes, completed } = req.body;
  
  const updates = [];
  const values = [];
  
  if (reminder_date !== undefined) {
    updates.push('reminder_date = ?');
    values.push(reminder_date);
  }
  if (reminder_type !== undefined) {
    updates.push('reminder_type = ?');
    values.push(reminder_type);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    values.push(notes);
  }
  if (completed !== undefined) {
    updates.push('completed = ?');
    values.push(completed ? 1 : 0);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  values.push(req.params.id);
  
  db.run(
    `UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Reminder not found' });
      }
      res.json({ message: 'Reminder updated successfully' });
    }
  );
});

// Delete reminder
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM reminders WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    res.json({ message: 'Reminder deleted successfully' });
  });
});

module.exports = router;

