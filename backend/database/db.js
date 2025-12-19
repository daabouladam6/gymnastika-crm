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

  db.run(`ALTER TABLE customers ADD COLUMN child_name TEXT`, () => {});
  db.run(`ALTER TABLE customers ADD COLUMN referral_source TEXT`, () => {});
  db.run(`ALTER TABLE customers ADD COLUMN pt_date DATE`, () => {});
  db.run(`ALTER TABLE customers ADD COLUMN customer_type TEXT DEFAULT 'basic'`, () => {});
  db.run(`ALTER TABLE customers ADD COLUMN trainer_email TEXT`, () => {});
  db.run(`ALTER TABLE customers ADD COLUMN archived INTEGER DEFAULT 0`, () => {});
  db.run(`ALTER TABLE customers ADD COLUMN archived_at DATETIME`, () => {});
  db.run(`ALTER TABLE customers ADD COLUMN pt_time TEXT`, () => {});

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

  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
});

module.exports = db;
