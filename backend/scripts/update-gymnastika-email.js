require('dotenv').config();
const db = require('../database/db');

const username = 'Gymnastika';
const newEmail = 'Gymnastika.lb@gmail.com';

console.log('Updating email for user:', username);
console.log('New email:', newEmail);
console.log('');

db.run(
  'UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?',
  [newEmail, username],
  function(err) {
    if (err) {
      console.error('Error updating email:', err);
      process.exit(1);
    }

    if (this.changes === 0) {
      console.log('User not found!');
      process.exit(1);
    }

    console.log('✓ Email updated successfully!');
    console.log('');
    console.log('Updated account:');
    console.log('  Username:', username);
    console.log('  Email:', newEmail);
    console.log('');
    
    // Verify the update
    db.get('SELECT username, email FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        console.error('Error verifying update:', err);
        process.exit(1);
      }
      console.log('Verification:');
      console.log('  Username:', user.username);
      console.log('  Email:', user.email);
      process.exit(0);
    });
  }
);

