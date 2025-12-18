const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');
const { JWT_SECRET } = require('../middleware/auth');

// Register new employee (admin only in production)
router.post('/register', async (req, res) => {
  const { username, email, password, full_name, role } = req.body;

  // Validate input
  if (!username || !email || !password || !full_name) {
    return res.status(400).json({ error: 'Username, email, password, and full name are required' });
  }

  // Check if user already exists
  db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    db.run(
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, full_name, role || 'employee'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create user' });
        }

        res.status(201).json({
          message: 'User created successfully',
          user: {
            id: this.lastID,
            username,
            email,
            full_name,
            role: role || 'employee'
          }
        });
      }
    );
  });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // #region agent log
  const fs = require('fs');
  const logPath = 'c:\\Users\\adamd\\.cursor\\.cursor\\debug.log';
  try {
    const logEntry = JSON.stringify({location:'backend/routes/auth.js:login-entry',message:'Login endpoint called',data:{username,hasPassword:!!password},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n';
    fs.appendFileSync(logPath, logEntry);
  } catch(e) {}
  // #endregion

  if (!username || !password) {
    // #region agent log
    try {
      const logEntry = JSON.stringify({location:'backend/routes/auth.js:login-validation-fail',message:'Login validation failed',data:{reason:'missing-credentials'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n';
      fs.appendFileSync(logPath, logEntry);
    } catch(e) {}
    // #endregion
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Find user
  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, user) => {
    if (err) {
      // #region agent log
      try {
        const logEntry = JSON.stringify({location:'backend/routes/auth.js:login-db-error',message:'Database error during login',data:{error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n';
        fs.appendFileSync(logPath, logEntry);
      } catch(e) {}
      // #endregion
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      // #region agent log
      try {
        const logEntry = JSON.stringify({location:'backend/routes/auth.js:login-user-not-found',message:'User not found',data:{username},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n';
        fs.appendFileSync(logPath, logEntry);
      } catch(e) {}
      // #endregion
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      // #region agent log
      try {
        const logEntry = JSON.stringify({location:'backend/routes/auth.js:login-password-invalid',message:'Invalid password',data:{username},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n';
        fs.appendFileSync(logPath, logEntry);
      } catch(e) {}
      // #endregion
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // #region agent log
    try {
      const logEntry = JSON.stringify({location:'backend/routes/auth.js:login-success',message:'Login successful',data:{userId:user.id,username:user.username,hasToken:!!token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n';
      fs.appendFileSync(logPath, logEntry);
    } catch(e) {}
    // #endregion

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  });
});

// Get current user (requires authentication)
router.get('/me', (req, res) => {
  // This route should be protected with authenticateToken middleware
  // For now, we'll check the token in the route
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    db.get('SELECT id, username, email, full_name, role FROM users WHERE id = ?', [decoded.userId], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    });
  });
});

// Logout (client-side should remove token)
router.post('/logout', (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // But we can log it for tracking purposes
  res.json({ message: 'Logged out successfully' });
});

// TEMPORARY: Setup endpoint to create initial user - REMOVE AFTER USE
router.post('/setup-user', async (req, res) => {
  const username = 'Gymnastika';
  const email = 'gymnastika@gymnastika.com';
  const password = 'AdamAli7';
  const full_name = 'Gymnastika Admin';
  const role = 'admin';

  // Check if user already exists
  db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, existingUser) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (existingUser) {
      return res.json({ message: 'User already exists', username, hint: 'Password is AdamAli7' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    db.run(
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, passwordHash, full_name, role],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create user' });
        }

        res.status(201).json({
          message: 'User created successfully!',
          credentials: {
            username: 'Gymnastika',
            password: 'AdamAli7'
          }
        });
      }
    );
  });
});

module.exports = router;

