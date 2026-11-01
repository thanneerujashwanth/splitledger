# Expense Tracker

A modern, real-time expense tracking and splitting application. It intelligently calculates group expenses and uses a **Greedy Settlement Algorithm** to minimize the number of transactions required to clear debts among friends.

## Features

- **Smart Debt Settlement:** The app calculates who owes whom and minimizes the total transactions (e.g., if A owes B $10, and B owes C $10, it simply tells A to pay C $10).
- **Real-Time Sync:** Built with native WebSockets (`ws`), actions like adding an expense or marking a debt as paid instantly update for all connected users without a page reload.
- **Premium UI:** A beautifully crafted, responsive dashboard with a clean sidebar layout, fast routing, and interactive data visualization using Recharts.
- **Zero Config Database:** Uses `better-sqlite3` for blazing fast, synchronous, file-based database queries out of the box.

## Tech Stack

**Frontend (Client)**
- React & Vite
- React Router DOM
- Recharts (for Dashboard insights)
- Lucide React (for Icons)

**Backend (Server)**
- Node.js & Express
- Native WebSockets (`ws` library)
- SQLite (`better-sqlite3`)

## Getting Started

### 1. Start the Backend Server

Navigate to the `server` directory, install dependencies, and start the node server. The server will automatically create the database and seed it with demo data.

```bash
cd splitledger/server
npm install
node index.js
```

The backend API and WebSocket will run on `http://localhost:5000`.

### 2. Start the Frontend Client

In a new terminal window, navigate to the `client` directory, install dependencies, and run the Vite development server.

```bash
cd splitledger/client
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.
