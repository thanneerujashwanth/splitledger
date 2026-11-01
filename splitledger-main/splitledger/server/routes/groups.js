const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/groups
router.get('/', authenticateToken, (req, res) => {
  const groups = db.prepare(`
    SELECT g.* FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ?
    ORDER BY g.created_at DESC
  `).all(req.user.id);
  
  // Attach members and calculate simple balances for display
  const result = groups.map(g => {
    g.members = db.prepare(`
      SELECT u.* FROM users u 
      JOIN group_members gm ON u.id = gm.user_id 
      WHERE gm.group_id = ?
    `).all(g.id);
    
    // Total spent in group
    const expenses = db.prepare('SELECT SUM(amount) as total FROM expenses WHERE group_id = ?').get(g.id);
    g.total_spent = expenses.total || 0;

    return g;
  });

  res.json(result);
});

// GET /api/groups/:id/members
router.get('/:id/members', (req, res) => {
  const members = db.prepare(`
    SELECT u.* FROM users u 
    JOIN group_members gm ON u.id = gm.user_id 
    WHERE gm.group_id = ?
  `).all(req.params.id);
  res.json(members);
});

// POST /api/groups
router.post('/', authenticateToken, (req, res) => {
  const { name, icon, member_ids } = req.body;
  
  const insertGroup = db.prepare('INSERT INTO groups (name, icon) VALUES (?, ?)');
  const insertMember = db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');

  const transaction = db.transaction(() => {
    const info = insertGroup.run(name, icon);
    const groupId = info.lastInsertRowid;
    for (const uid of member_ids) {
      insertMember.run(groupId, uid);
    }
    return groupId;
  });

  try {
    const groupId = transaction();
    const newGroup = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
    req.app.locals.sendToUsers(member_ids, 'GROUPS_UPDATED', {
      type: 'group_created',
      groupId
    });
    res.status(201).json(newGroup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
