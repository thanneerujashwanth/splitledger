const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/splits/:id/accept
router.post('/:id/accept', (req, res) => {
  try {
    const info = db.prepare(`UPDATE splits SET status = 'accepted' WHERE id = ?`).run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Split not found' });
    
    // Get the updated split data
    const split = db.prepare(`SELECT * FROM splits WHERE id = ?`).get(req.params.id);
    const expense = db.prepare(`SELECT * FROM expenses WHERE id = ?`).get(split.expense_id);
    const memberIds = db.prepare('SELECT user_id FROM group_members WHERE group_id = ?')
      .all(expense.group_id)
      .map(member => member.user_id);
    
    req.app.locals.sendToUsers(memberIds, 'split:accepted', { split, group_id: expense.group_id });
    res.json({ success: true, split });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/splits/:id/pay
router.post('/:id/pay', (req, res) => {
  try {
    const info = db.prepare(`UPDATE splits SET status = 'paid' WHERE id = ?`).run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Split not found' });
    
    const split = db.prepare(`SELECT * FROM splits WHERE id = ?`).get(req.params.id);
    const expense = db.prepare(`SELECT * FROM expenses WHERE id = ?`).get(split.expense_id);
    const memberIds = db.prepare('SELECT user_id FROM group_members WHERE group_id = ?')
      .all(expense.group_id)
      .map(member => member.user_id);
    
    req.app.locals.sendToUsers(memberIds, 'split:paid', { split, group_id: expense.group_id });
    res.json({ success: true, split });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
