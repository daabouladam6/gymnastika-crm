const bcrypt = require('bcryptjs');
const db = require('../database/db');

const username = 'aliwehbe';
const email = 'aliwehbe@gymnastika.com';
const password = 'AdamAli7';
const full_name = 'Ali Wehbe';
const role = 'employee';

bcrypt.hash(password, 10).then(hash => {
  db.run(
    'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
    [username, email, hash, full_name, role],
    function(err) {
      if (err) {
        console.error('Error:', err.message);
        process.exit(1);
      }
      console.log('✓ User created successfully!');
      console.log('  Username:', username);
      console.log('  Password:', password);
      process.exit(0);
    }
  );
});

