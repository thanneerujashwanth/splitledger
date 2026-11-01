const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Register a new user
router.post('/register', (req, res) => {
  const { username, email, password, name } = req.body;
  
  if (!username || !email || !password || !name) {
    return res.status(400).json({ error: 'Username, email, password, and name are required' });
  }

  try {
    const existing = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)').get(username, email);
    if (existing) {
      if (existing.username.toLowerCase() === username.toLowerCase()) return res.status(400).json({ error: 'Username already taken' });
      if (existing.email.toLowerCase() === email.toLowerCase()) return res.status(400).json({ error: 'Email already registered' });
    }

    const initials = name.substring(0, 1).toUpperCase();
    const colors = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const hashedPassword = bcrypt.hashSync(password, 10);

    const insertUser = db.prepare('INSERT INTO users (username, email, password, name, initials, color) VALUES (?, ?, ?, ?, ?, ?)');
    const result = insertUser.run(username, email, hashedPassword, name, initials, color);

    const user = { id: result.lastInsertRowid, username, email, name, initials, color };
    
    // 1-day expiration as requested
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(identifier, identifier);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const payload = { id: user.id, username: user.username, email: user.email, name: user.name, initials: user.initials, color: user.color };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: payload });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
