// Quick script to create an admin user
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../database/db');

async function createAdmin() {
  const username = 'admin';
  const email = 'admin@gymnastika.com';
  const password = 'admin123';  // Change this after first login!
  const full_name = 'Administrator';
  const role = 'admin';

  console.log('Creating admin user...\n');

  // Check if user exists
  db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, existingUser) => {
    if (err) {
      console.error('Database error:', err);
      process.exit(1);
    }
    
    if (existingUser) {
      console.log('Admin user already exists!');
      console.log('\nLogin with:');
      console.log('  Username: admin');
      console.log('  Password: admin123 (or whatever you set before)');
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    db.run(
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, full_name, role],
      function(err) {
        if (err) {
          console.error('Error creating user:', err);
          process.exit(1);
        }

        console.log('✅ Admin user created!\n');
        console.log('Login credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━');
        console.log('  Username: admin');
        console.log('  Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  Please change the password after logging in!\n');
        
        process.exit(0);
      }
    );
  });
}

createAdmin();

