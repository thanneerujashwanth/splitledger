const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clientsByUserId = new Map();

const addClientForUser = (userId, ws) => {
  const key = String(userId);
  if (!clientsByUserId.has(key)) {
    clientsByUserId.set(key, new Set());
  }
  clientsByUserId.get(key).add(ws);
};

const removeClientForUser = (userId, ws) => {
  const key = String(userId);
  const clients = clientsByUserId.get(key);
  if (!clients) return;

  clients.delete(ws);
  if (clients.size === 0) {
    clientsByUserId.delete(key);
  }
};

const sendToClient = (client, event, data) => {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ event, data }));
  }
};

// Broadcast helper function attached to app locals so routes can use it
app.locals.broadcast = (event, data) => {
  wss.clients.forEach((client) => {
    sendToClient(client, event, data);
  });
};

app.locals.sendToUsers = (userIds, event, data) => {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean).map(String))];
  uniqueUserIds.forEach((userId) => {
    const clients = clientsByUserId.get(userId);
    if (!clients) return;

    clients.forEach((client) => sendToClient(client, event, data));
  });
};

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.split('?')[1] || '');
  const token = params.get('token');

  if (!token) {
    ws.close(1008, 'Authentication required');
    return;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    ws.userId = user.id;
    addClientForUser(user.id, ws);
    sendToClient(ws, 'CONNECTED', { userId: user.id });
    console.log(`WebSocket connected for user ${user.id}`);
  } catch (error) {
    ws.close(1008, 'Invalid token');
    return;
  }

  ws.on('close', () => {
    removeClientForUser(ws.userId, ws);
    console.log(`WebSocket disconnected for user ${ws.userId}`);
  });
});

// Import and mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/splits', require('./routes/splits'));
app.use('/api/settlements', require('./routes/settlements'));
app.use('/api/insights', require('./routes/insights'));

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`SplitLedger server running on http://localhost:${PORT}`);
});
