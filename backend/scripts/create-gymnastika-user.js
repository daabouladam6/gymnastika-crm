require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../database/db');

async function createGymnastikaUser() {
  const username = 'Gymnastika';
  const email = 'gymnastika@example.com'; // You can change this
  const password = 'AdamAli7';
  const full_name = 'Gymnastika User';
  const role = 'employee';

  console.log('Creating employee account...\n');

  // Check if user exists
  db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, existingUser) => {
    if (err) {
      console.error('Database error:', err);
      process.exit(1);
    }
    
    if (existingUser) {
      console.log('User already exists!');
      console.log('Username:', username);
      console.log('Email:', email);
      process.exit(0);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    db.run(
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, full_name, role],
      function(err) {
        if (err) {
          console.error('Error creating user:', err);
          process.exit(1);
        }

        console.log('✓ User created successfully!\n');
        console.log('Login Credentials:');
        console.log('  Username:', username);
        console.log('  Password:', password);
        console.log('  Email:', email);
        console.log('  Full Name:', full_name);
        console.log('  Role:', role);
        console.log('\nYou can now login at http://localhost:3000/login\n');
        
        process.exit(0);
      }
    );
  });
}

createGymnastikaUser();

