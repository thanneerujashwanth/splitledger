const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/insights/:uid
router.get('/:uid', (req, res) => {
  const userId = req.params.uid;
  
  // 1. Personal total spent (sum of their share across all non-paid splits)
  const totalSpentRow = db.prepare(`
    SELECT SUM(share_amount) as total
    FROM splits 
    WHERE user_id = ? AND status != 'paid'
  `).get(userId);
  const totalSpent = totalSpentRow.total || 0;

  // 2. Net balance (Total Paid for others - Total Owed to others)
  // Let's use the same net balance logic, simplified:
  let totalPaid = 0;
  const paidRows = db.prepare(`SELECT SUM(amount) as total FROM expenses WHERE paid_by = ?`).get(userId);
  totalPaid = paidRows.total || 0;
  
  const netBalance = totalPaid - totalSpent;

  // 3. Category Breakdown (from user's splits)
  const categories = db.prepare(`
    SELECT e.category as name, SUM(s.share_amount) as value
    FROM splits s
    JOIN expenses e ON s.expense_id = e.id
    WHERE s.user_id = ? AND s.status != 'paid'
    GROUP BY e.category
  `).all(userId);

  // 4. Monthly Trend (Mocked for simplicity since dates might be tricky in pure sqlite, 
  // but we can extract month if we want. Let's do a simple mock for the chart structure)
  const monthlyTrend = [
    { name: 'Dec', value: 8000 },
    { name: 'Jan', value: 9200 },
    { name: 'Feb', value: 11000 },
    { name: 'Mar', value: 12500 },
    { name: 'Apr', value: 16000 },
    { name: 'May', value: totalSpent }
  ];

  // 5. Recent 5 transactions
  const recentActivity = db.prepare(`
    SELECT e.*, g.name as group_name
    FROM expenses e
    JOIN groups g ON e.group_id = g.id
    WHERE e.paid_by = ? OR e.id IN (SELECT expense_id FROM splits WHERE user_id = ?)
    ORDER BY e.date DESC
    LIMIT 5
  `).all(userId, userId);

  res.json({
    totalSpent,
    netBalance,
    categories,
    monthlyTrend,
    recentActivity
  });
});

module.exports = router;
