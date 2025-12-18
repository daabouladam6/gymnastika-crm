const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../../database/db');

// One-time setup endpoint to create initial users
// DELETE THIS FILE AFTER USE!
router.get('/create-users', async (req, res) => {
  const users = [
    { username: 'aliwehbe', email: 'aliwehbe@gymnastika.com', password: 'AdamAli7', full_name: 'Ali Wehbe', role: 'employee' },
    { username: 'Gymnastika', email: 'gymnastika@gymnastika.com', password: 'AdamAli7', full_name: 'Gymnastika Admin', role: 'admin' }
  ];

  const results = [];

  for (const user of users) {
    try {
      const hash = await bcrypt.hash(user.password, 10);
      
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
          [user.username, user.email, hash, user.full_name, user.role],
          function(err) {
            if (err) {
              if (err.message.includes('UNIQUE')) {
                results.push({ username: user.username, status: 'already exists' });
              } else {
                results.push({ username: user.username, status: 'error', message: err.message });
              }
            } else {
              results.push({ username: user.username, status: 'created', id: this.lastID });
            }
            resolve();
          }
        );
      });
    } catch (error) {
      results.push({ username: user.username, status: 'error', message: error.message });
    }
  }

  res.json({
    message: 'Setup complete! DELETE THIS ENDPOINT NOW!',
    results,
    warning: 'Remove /api/setup route from server.js and delete setup.js file'
  });
});

module.exports = router;

