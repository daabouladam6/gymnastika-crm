const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'customers.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    child_name TEXT,
    referral_source TEXT,
    notes TEXT,
    wants_pt INTEGER DEFAULT 0,
    pt_message_sent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Add child_name column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE customers ADD COLUMN child_name TEXT`, (err) => {
    // Ignore error if column already exists
  });

  // Add referral_source column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE customers ADD COLUMN referral_source TEXT`, (err) => {
    // Ignore error if column already exists
  });

  // Add pt_date column for PT customers (for existing databases)
  db.run(`ALTER TABLE customers ADD COLUMN pt_date DATE`, (err) => {
    // Ignore error if column already exists
  });

  // Add customer_type column to distinguish between basic and PT customers
  db.run(`ALTER TABLE customers ADD COLUMN customer_type TEXT DEFAULT 'basic'`, (err) => {
    // Ignore error if column already exists
  });

  // Add trainer_email column for PT customers to store assigned trainer
  db.run(`ALTER TABLE customers ADD COLUMN trainer_email TEXT`, (err) => {
    // Ignore error if column already exists
  });

  // Add archived column for soft delete functionality
  db.run(`ALTER TABLE customers ADD COLUMN archived INTEGER DEFAULT 0`, (err) => {
    // Ignore error if column already exists
  });

  // Add archived_at column to track when customer was archived
  db.run(`ALTER TABLE customers ADD COLUMN archived_at DATETIME`, (err) => {
    // Ignore error if column already exists
  });

  // Add pt_time column for PT session time
  db.run(`ALTER TABLE customers ADD COLUMN pt_time TEXT`, (err) => {
    // Ignore error if column already exists
  });

  db.run(`CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    reminder_date DATE NOT NULL,
    reminder_type TEXT DEFAULT 'follow_up',
    completed INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  )`);

  // Create index on reminder_date for faster queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_reminder_date ON reminders(reminder_date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_reminder_completed ON reminders(completed)`);

  // Create users/employees table for authentication
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'employee',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create index on username and email for faster lookups
  db.run(`CREATE INDEX IF NOT EXISTS idx_username ON users(username)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_email ON users(email)`);

  // Create sessions table for session management
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Create index on pt_date for PT email reminders
  db.run(`CREATE INDEX IF NOT EXISTS idx_pt_date ON customers(pt_date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_type ON customers(customer_type)`);
});

module.exports = db;

