require('dotenv').config();

// Check if DATABASE_URL is set (PostgreSQL), otherwise fall back to SQLite for local dev
const isPostgres = !!process.env.DATABASE_URL;

let db;

if (isPostgres) {
  // PostgreSQL configuration for production (Render PostgreSQL)
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
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
            const context = {
              lastID: result.rows[0]?.id || null,
              changes: result.rowCount
            };
            callback.call(context, null);
          }
        })
        .catch(err => {
          console.error('PostgreSQL query error:', err.message);
          if (callback) callback(err);
        });
    },

    get: function(sql, params = [], callback) {
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
          console.error('PostgreSQL query error:', err.message);
          if (callback) callback(err, null);
        });
    },

    all: function(sql, params = [], callback) {
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
          console.error('PostgreSQL query error:', err.message);
          if (callback) callback(err, []);
        });
    },

    serialize: function(callback) {
      if (callback) callback();
    },

    // Export data for backup
    exportData: async function() {
      try {
        const customers = await pool.query('SELECT * FROM customers');
        const reminders = await pool.query('SELECT * FROM reminders');
        const users = await pool.query('SELECT * FROM users');
        return {
          exportDate: new Date().toISOString(),
          customers: customers.rows,
          reminders: reminders.rows,
          users: users.rows
        };
      } catch (err) {
        console.error('Export error:', err.message);
        return null;
      }
    }
  };

  // Initialize PostgreSQL tables
  const initPostgres = async () => {
    try {
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
          is_recurring INTEGER DEFAULT 0,
          recurrence_type TEXT,
          recurrence_interval INTEGER,
          recurrence_end_date DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add recurring columns if they don't exist (for existing databases)
      await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_recurring INTEGER DEFAULT 0`).catch(() => {});
      await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS recurrence_type TEXT`).catch(() => {});
      await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER`).catch(() => {});
      await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS recurrence_end_date DATE`).catch(() => {});
      // pt_days stores comma-separated day numbers (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
      await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS pt_days TEXT`).catch(() => {});

      await pool.query(`
        CREATE TABLE IF NOT EXISTS reminders (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER NOT NULL,
          reminder_date DATE NOT NULL,
          reminder_type TEXT DEFAULT 'follow_up',
          completed INTEGER DEFAULT 0,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

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

      await pool.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ PostgreSQL database connected and initialized (Render PostgreSQL)');
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

  // Add exportData method for SQLite too
  db.exportData = function() {
    return new Promise((resolve, reject) => {
      const data = { exportDate: new Date().toISOString() };
      db.all('SELECT * FROM customers', [], (err, customers) => {
        if (err) return reject(err);
        data.customers = customers;
        db.all('SELECT * FROM reminders', [], (err, reminders) => {
          if (err) return reject(err);
          data.reminders = reminders;
          db.all('SELECT * FROM users', [], (err, users) => {
            if (err) return reject(err);
            data.users = users;
            resolve(data);
          });
        });
      });
    });
  };

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
    // Recurring session columns
    db.run(`ALTER TABLE customers ADD COLUMN is_recurring INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE customers ADD COLUMN recurrence_type TEXT`, () => {});
    db.run(`ALTER TABLE customers ADD COLUMN recurrence_interval INTEGER`, () => {});
    db.run(`ALTER TABLE customers ADD COLUMN recurrence_end_date DATE`, () => {});
    // pt_days stores comma-separated day numbers (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
    db.run(`ALTER TABLE customers ADD COLUMN pt_days TEXT`, () => {});

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

  console.log('✅ SQLite database initialized (local development)');
}

module.exports = db;
