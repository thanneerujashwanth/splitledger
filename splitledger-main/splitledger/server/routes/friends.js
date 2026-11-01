const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Get friends and pending requests
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    // Accepted friends
    const friends = db.prepare(`
      SELECT u.id, u.username, u.name, u.initials, u.color
      FROM friend_requests fr
      JOIN users u ON (fr.requester_id = u.id OR fr.recipient_id = u.id)
      WHERE (fr.requester_id = ? OR fr.recipient_id = ?) 
      AND fr.status = 'accepted'
      AND u.id != ?
    `).all(userId, userId, userId);

    // Pending incoming requests
    const pendingIncoming = db.prepare(`
      SELECT fr.id as request_id, u.id, u.username, u.name, u.initials, u.color
      FROM friend_requests fr
      JOIN users u ON fr.requester_id = u.id
      WHERE fr.recipient_id = ? AND fr.status = 'pending'
    `).all(userId);

    // Pending outgoing requests
    const pendingOutgoing = db.prepare(`
      SELECT u.id, u.username, u.name, u.initials, u.color
      FROM friend_requests fr
      JOIN users u ON fr.recipient_id = u.id
      WHERE fr.requester_id = ? AND fr.status = 'pending'
    `).all(userId);

    res.json({ friends, pendingIncoming, pendingOutgoing });
  } catch (error) {
    console.error('Fetch friends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send friend request
router.post('/request', authenticateToken, (req, res) => {
  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'Target user ID required' });

  try {
    // Check if request already exists
    const existing = db.prepare('SELECT * FROM friend_requests WHERE (requester_id = ? AND recipient_id = ?) OR (requester_id = ? AND recipient_id = ?)')
      .get(req.user.id, targetUserId, targetUserId, req.user.id);
      
    if (existing) {
      return res.status(400).json({ error: 'Friend request already exists or you are already friends' });
    }

    db.prepare('INSERT INTO friend_requests (requester_id, recipient_id, status) VALUES (?, ?, ?)')
      .run(req.user.id, targetUserId, 'pending');

    req.app.locals.sendToUsers([req.user.id, targetUserId], 'FRIENDS_UPDATED', {
      type: 'request_sent',
      requesterId: req.user.id,
      recipientId: targetUserId
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept friend request
router.post('/accept', authenticateToken, (req, res) => {
  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: 'Request ID required' });

  try {
    const reqInfo = db.prepare('SELECT requester_id FROM friend_requests WHERE id = ? AND recipient_id = ?').get(requestId, req.user.id);

    const result = db.prepare("UPDATE friend_requests SET status = 'accepted' WHERE id = ? AND recipient_id = ? AND status = 'pending'")
      .run(requestId, req.user.id);
      
    if (result.changes === 0) {
      return res.status(400).json({ error: 'Invalid request ID or not authorized' });
    }

    if (reqInfo) {
      req.app.locals.sendToUsers([reqInfo.requester_id, req.user.id], 'FRIENDS_UPDATED', {
        type: 'request_accepted',
        requesterId: reqInfo.requester_id,
        recipientId: req.user.id
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove friend or cancel request
router.post('/remove', authenticateToken, (req, res) => {
  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'Target user ID required' });

  try {
    const result = db.prepare('DELETE FROM friend_requests WHERE (requester_id = ? AND recipient_id = ?) OR (requester_id = ? AND recipient_id = ?)')
      .run(req.user.id, targetUserId, targetUserId, req.user.id);
      
    if (result.changes === 0) {
      return res.status(400).json({ error: 'Friend or request not found' });
    }

    req.app.locals.sendToUsers([req.user.id, targetUserId], 'FRIENDS_UPDATED', {
      type: 'friend_removed',
      userId1: req.user.id,
      userId2: targetUserId
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
