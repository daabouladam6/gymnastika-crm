const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../../database/db');

router.get('/create-users', async (req, res) => {
  const usersToCreate = [
    { username: 'aliwehbe', password: 'AdamAli7', email: 'aliwehbe@gymnastika.com', full_name: 'Ali Wehbe', role: 'employee' },
    { username: 'Gymnastika', password: 'AdamAli7', email: 'Gymnastika.lb@gmail.com', full_name: 'Gymnastika Admin', role: 'admin' }
  ];

  const results = [];

  for (const user of usersToCreate) {
    try {
      const existingUser = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM users WHERE username = ? OR email = ?', [user.username, user.email], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (existingUser) {
        results.push({ username: user.username, status: 'already_exists' });
        continue;
      }

      const hash = await bcrypt.hash(user.password, 10);
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
          [user.username, user.email, hash, user.full_name, user.role],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
      results.push({ username: user.username, status: 'created' });
    } catch (error) {
      results.push({ username: user.username, status: 'failed', error: error.message });
    }
  }

  res.json({ message: 'Setup complete! DELETE THIS ENDPOINT NOW!', results });
});

module.exports = router;

