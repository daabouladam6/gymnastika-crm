const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../../database/db');

router.get('/create-users', async (req, res) => {
  const usersToCreate = [
    { username: 'aliwehbe', password: 'AdamAli7' },
    { username: 'Gymnastika', password: 'AdamAli7' }
  ];

  const results = [];

  for (const user of usersToCreate) {
    try {
      const existingUser = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM users WHERE username = ?', [user.username], (err, row) => {
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
          'INSERT INTO users (username, password_hash) VALUES (?, ?)',
          [user.username, hash],
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

