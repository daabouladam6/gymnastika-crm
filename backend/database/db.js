require('dotenv').config();
const { Pool } = require('pg');

// Check if DATABASE_URL is set (PostgreSQL), otherwise fall back to SQLite for local dev
const isPostgres = !!process.env.DATABASE_URL;

let db;

if (isPostgres) {
  // PostgreSQL configuration for production (Render)
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Create a SQLite-compatible wrapper for PostgreSQL
  db = {
    // Convert ? placeholders to $1, $2, ... for PostgreSQL
    convertPlaceholders: (sql) => {
      let index = 0;
      return sql.replace(/\?/g, () => `$${++index}`);
    },

    run: function(sql, params = [], callback) {
      let pgSql = this.convertPlaceholders(sql);
      
      // For INSERT statements, add RETURNING id to get the lastID
      if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
        pgSql = pgSql.replace(/;?\s*$/, ' RETURNING id');
      }
      
      pool.query(pgSql, params)
        .then(result => {
          if (callback) {
            // Mimic SQLite's this.lastID and this.changes
            const context = {
              lastID: result.rows[0]?.id || null,
              changes: result.rowCount
            };
            callback.call(context, null);
          }
        })
        .catch(err => {
          if (callback) callback(err);
        });
    },

    get: function(sql, params = [], callback) {
      // Handle case where params is the callback
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      const pgSql = this.convertPlaceholders(sql);
      pool.query(pgSql, params)
        .then(result => {
          if (callback) callback(null, result.rows[0] || null);
        })
        .catch(err => {
          if (callback) callback(err, null);
        });
    },

    all: function(sql, params = [], callback) {
      // Handle case where params is the callback
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      const pgSql = this.convertPlaceholders(sql);
      pool.query(pgSql, params)
        .then(result => {
          if (callback) callback(null, result.rows);
        })
        .catch(err => {
          if (callback) callback(err, []);
        });
    },

    serialize: function(callback) {
      // PostgreSQL doesn't need serialize, just run the callback
      if (callback) callback();
    },

    // Direct query method for PostgreSQL
    query: function(sql, params = []) {
      return pool.query(this.convertPlaceholders(sql), params);
    }
  };

  // Initialize PostgreSQL tables
  const initPostgres = async () => {
    try {
      // Create customers table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT,
          child_name TEXT,
          referral_source TEXT,
          notes TEXT,
          wants_pt INTEGER DEFAULT 0,
          pt_message_sent INTEGER DEFAULT 0,
          customer_type TEXT DEFAULT 'basic',
          pt_date DATE,
          pt_time TEXT,
          trainer_email TEXT,
          archived INTEGER DEFAULT 0,
          archived_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create reminders table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reminders (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER NOT NULL REFERENCES customers(id),
          reminder_date DATE NOT NULL,
          reminder_type TEXT DEFAULT 'follow_up',
          completed INTEGER DEFAULT 0,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for reminders
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_reminder_date ON reminders(reminder_date)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_reminder_completed ON reminders(completed)`);

      // Create users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT DEFAULT 'employee',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for users
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_username ON users(username)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_email ON users(email)`);

      // Create sessions table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for customers
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_pt_date ON customers(pt_date)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_customer_type ON customers(customer_type)`);

      console.log('✅ PostgreSQL database initialized successfully');
    } catch (err) {
      console.error('❌ PostgreSQL initialization error:', err.message);
    }
  };

  initPostgres();

} else {
  // SQLite configuration for local development
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');

  const dbPath = path.join(__dirname, 'customers.db');
  db = new sqlite3.Database(dbPath);

  // Initialize SQLite database
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

    // Add columns if they don't exist (for existing databases)
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

    db.run(`CREATE INDEX IF NOT EXISTS idx_reminder_date ON reminders(reminder_date)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_reminder_completed ON reminders(completed)`);

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

    db.run(`CREATE INDEX IF NOT EXISTS idx_username ON users(username)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_email ON users(email)`);

    db.run(`CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE INDEX IF NOT EXISTS idx_pt_date ON customers(pt_date)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_customer_type ON customers(customer_type)`);
  });

  console.log('✅ SQLite database initialized (local development)');
}

module.exports = db;
