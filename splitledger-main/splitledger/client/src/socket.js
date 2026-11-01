const socketUrl = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:5000';

let socket = null;
let activeToken = null;
let reconnectTimer = null;
let reconnectAttempts = 0;

const listeners = new Set();

const clearReconnectTimer = () => {
  if (!reconnectTimer) return;

  clearTimeout(reconnectTimer);
  reconnectTimer = null;
};

const cleanupSocket = () => {
  if (!socket) return;

  socket.onopen = null;
  socket.onerror = null;
  socket.onclose = null;
  socket.onmessage = null;
};

export const subscribeToEvents = (callback) => {
  listeners.add(callback);

  return () => {
    listeners.delete(callback);
  };
};

const notifyListeners = (event) => {
  listeners.forEach((callback) => callback(event));
};

const scheduleReconnect = () => {
  if (!activeToken || reconnectTimer) return;

  const delay = Math.min(30000, 1000 * (2 ** reconnectAttempts));
  reconnectAttempts += 1;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectSocket(activeToken);
  }, delay);
};

export const connectSocket = (token) => {
  if (!token) return;

  if (
    socket &&
    activeToken === token &&
    (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  activeToken = token;
  clearReconnectTimer();

  if (socket) {
    cleanupSocket();
    socket.close();
  }

  const nextSocket = new WebSocket(`${socketUrl}?token=${encodeURIComponent(token)}`);
  socket = nextSocket;

  nextSocket.onopen = () => {
    if (socket !== nextSocket) return;

    reconnectAttempts = 0;
    console.log('WebSocket connected to', socketUrl);
  };

  nextSocket.onerror = (error) => {
    if (socket !== nextSocket) return;

    console.error('WebSocket Error:', error);
  };

  nextSocket.onclose = () => {
    if (socket !== nextSocket) return;

    socket = null;
    console.log('WebSocket disconnected');
    scheduleReconnect();
  };

  nextSocket.onmessage = (event) => {
    if (socket !== nextSocket) return;

    try {
      notifyListeners(JSON.parse(event.data));
    } catch (error) {
      console.error('Error parsing WS message', error);
    }
  };
};

export const disconnectSocket = () => {
  activeToken = null;
  reconnectAttempts = 0;
  clearReconnectTimer();

  if (!socket) return;

  cleanupSocket();
  socket.close();
  socket = null;
};
