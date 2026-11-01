const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/expenses?group_id=X
router.get('/', (req, res) => {
  const { group_id } = req.query;
  if (!group_id) return res.status(400).json({ error: 'group_id is required' });

  const expenses = db.prepare(`
    SELECT e.*, u.name as paid_by_name
    FROM expenses e
    JOIN users u ON e.paid_by = u.id
    WHERE e.group_id = ?
    ORDER BY e.date DESC
  `).all(group_id);

  // Attach splits to each expense
  const getSplits = db.prepare(`
    SELECT s.*, u.name as user_name
    FROM splits s
    JOIN users u ON s.user_id = u.id
    WHERE s.expense_id = ?
  `);

  const result = expenses.map(e => {
    e.splits = getSplits.all(e.id);
    return e;
  });

  res.json(result);
});

// POST /api/expenses
router.post('/', (req, res) => {
  const { group_id, paid_by, amount, category, description, splits } = req.body;
  // splits = [{user_id: 1, share_amount: 50}, ...]

  const insertExpense = db.prepare(`
    INSERT INTO expenses (group_id, paid_by, amount, category, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const insertSplit = db.prepare(`
    INSERT INTO splits (expense_id, user_id, share_amount, status)
    VALUES (?, ?, ?, 'pending')
  `);

  // Transaction for atomicity
  const transaction = db.transaction(() => {
    const info = insertExpense.run(group_id, paid_by, amount, category, description);
    const expenseId = info.lastInsertRowid;
    
    for (const split of splits) {
      insertSplit.run(expenseId, split.user_id, split.share_amount);
    }
    
    return expenseId;
  });

  try {
    const expenseId = transaction();
    
    // Fetch the inserted data to broadcast
    const newExpense = db.prepare(`
      SELECT e.*, u.name as paid_by_name 
      FROM expenses e JOIN users u ON e.paid_by = u.id 
      WHERE e.id = ?
    `).get(expenseId);
    
    newExpense.splits = db.prepare(`
      SELECT s.*, u.name as user_name 
      FROM splits s JOIN users u ON s.user_id = u.id 
      WHERE s.expense_id = ?
    `).all(expenseId);

    const memberIds = db.prepare('SELECT user_id FROM group_members WHERE group_id = ?')
      .all(group_id)
      .map(member => member.user_id);

    req.app.locals.sendToUsers(memberIds, 'expense:added', newExpense);
    
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
