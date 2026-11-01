const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Search users by username
router.get('/search', authenticateToken, (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    const users = db.prepare('SELECT id, username, name, initials, color FROM users WHERE username LIKE ? AND id != ? LIMIT 10')
      .all(`%${q}%`, req.user.id);
    res.json(users);
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
