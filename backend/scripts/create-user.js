require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createUser() {
  console.log('Create Employee Account\n');
  
  const username = await question('Username: ');
  const email = await question('Email: ');
  const password = await question('Password: ');
  const full_name = await question('Full Name: ');
  const role = await question('Role (employee/admin, default: employee): ') || 'employee';

  if (!username || !email || !password || !full_name) {
    console.error('All fields are required!');
    rl.close();
    process.exit(1);
  }

  // Check if user exists
  db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, existingUser) => {
    if (err) {
      console.error('Database error:', err);
      rl.close();
      process.exit(1);
    }
    
    if (existingUser) {
      console.error('Username or email already exists!');
      rl.close();
      process.exit(1);
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
          rl.close();
          process.exit(1);
        }

        console.log('\n✓ User created successfully!');
        console.log(`  ID: ${this.lastID}`);
        console.log(`  Username: ${username}`);
        console.log(`  Email: ${email}`);
        console.log(`  Full Name: ${full_name}`);
        console.log(`  Role: ${role}\n`);
        
        rl.close();
        process.exit(0);
      }
    );
  });
}

createUser();

