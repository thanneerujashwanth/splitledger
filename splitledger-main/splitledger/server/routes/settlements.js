const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/settlements/:gid
router.get('/:gid', (req, res) => {
  const groupId = req.params.gid;
  
  // 1. Calculate net balances for each user in the group
  // A user's net balance = (Total they paid for group expenses) - (Total of their share in splits)
  
  const members = db.prepare(`SELECT user_id FROM group_members WHERE group_id = ?`).all(groupId);
  if (!members.length) return res.json([]);
  
  const balances = {};
  members.forEach(m => balances[m.user_id] = 0);

  // Add what they paid
  const paidRows = db.prepare(`SELECT paid_by, SUM(amount) as total_paid FROM expenses WHERE group_id = ? GROUP BY paid_by`).all(groupId);
  paidRows.forEach(row => {
    if (balances[row.paid_by] !== undefined) balances[row.paid_by] += row.total_paid;
  });

  // Subtract what they owe
  const owedRows = db.prepare(`
    SELECT s.user_id, SUM(s.share_amount) as total_owed
    FROM splits s
    JOIN expenses e ON s.expense_id = e.id
    WHERE e.group_id = ? AND s.status != 'paid'
    GROUP BY s.user_id
  `).all(groupId);
  
  owedRows.forEach(row => {
    if (balances[row.user_id] !== undefined) balances[row.user_id] -= row.total_owed;
  });

  // 2. Separate into creditors and debtors
  let creditors = [];
  let debtors = [];
  
  for (const [userId, balance] of Object.entries(balances)) {
    if (balance > 0.01) creditors.push({ id: parseInt(userId), amount: balance });
    else if (balance < -0.01) debtors.push({ id: parseInt(userId), amount: -balance });
  }

  // Sort by largest amount first
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // 3. Greedy algorithm to settle debts
  const settlements = [];
  let i = 0; // debtors index
  let j = 0; // creditors index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const settleAmount = Math.min(debtor.amount, creditor.amount);
    
    // Get user details for readable response
    const fromUser = db.prepare('SELECT * FROM users WHERE id = ?').get(debtor.id);
    const toUser = db.prepare('SELECT * FROM users WHERE id = ?').get(creditor.id);
    
    settlements.push({
      from: fromUser,
      to: toUser,
      amount: parseFloat(settleAmount.toFixed(2))
    });

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  res.json(settlements);
});

module.exports = router;
