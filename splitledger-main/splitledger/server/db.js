const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'splitledger.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize tables
const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requester_id) REFERENCES users(id),
      FOREIGN KEY (recipient_id) REFERENCES users(id),
      UNIQUE(requester_id, recipient_id)
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS group_members (
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      paid_by INTEGER NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (paid_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      share_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, paid
      FOREIGN KEY (expense_id) REFERENCES expenses(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      from_user INTEGER NOT NULL,
      to_user INTEGER NOT NULL,
      amount REAL NOT NULL,
      settled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (from_user) REFERENCES users(id),
      FOREIGN KEY (to_user) REFERENCES users(id)
    );
  `);

  // Seed demo data if users table is empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    console.log('Seeding initial demo data...');
    
    const bcrypt = require('bcryptjs');
    const defaultPassword = bcrypt.hashSync('password123', 10);
    const insertUser = db.prepare('INSERT INTO users (username, email, password, name, initials, color) VALUES (?, ?, ?, ?, ?, ?)');
    insertUser.run('ravi', 'ravi@example.com', defaultPassword, 'Ravi', 'R', '#0ea5e9'); // user 1
    insertUser.run('priya', 'priya@example.com', defaultPassword, 'Priya', 'P', '#10b981'); // user 2
    insertUser.run('amit', 'amit@example.com', defaultPassword, 'Amit', 'A', '#8b5cf6'); // user 3
    insertUser.run('neha', 'neha@example.com', defaultPassword, 'Neha', 'N', '#f59e0b'); // user 4
    
    // Seed friends
    const insertFriend = db.prepare("INSERT INTO friend_requests (requester_id, recipient_id, status) VALUES (?, ?, 'accepted')");
    insertFriend.run(1, 2);
    insertFriend.run(1, 3);
    insertFriend.run(2, 3);
    
    const insertGroup = db.prepare('INSERT INTO groups (name, icon) VALUES (?, ?)');
    const groupInfo = insertGroup.run('Goa Trip', '🌴');
    const groupId = groupInfo.lastInsertRowid;
    
    const insertMember = db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');
    insertMember.run(groupId, 1);
    insertMember.run(groupId, 2);
    insertMember.run(groupId, 3);
    insertMember.run(groupId, 4);

    // Add some mock expenses to demonstrate the settlement algo
    const insertExpense = db.prepare('INSERT INTO expenses (group_id, paid_by, amount, category, description) VALUES (?, ?, ?, ?, ?)');
    const insertSplit = db.prepare('INSERT INTO splits (expense_id, user_id, share_amount, status) VALUES (?, ?, ?, ?)');

    // Expense 1: Ravi paid 4000 for Hotel, everyone splits equally (1000 each)
    let exp1 = insertExpense.run(groupId, 1, 4000, 'Travel', 'Hotel Taj Goa');
    [1, 2, 3, 4].forEach(u => insertSplit.run(exp1.lastInsertRowid, u, 1000, 'pending'));

    // Expense 2: Priya paid 1200 for Food, everyone splits equally (300 each)
    let exp2 = insertExpense.run(groupId, 2, 1200, 'Food', 'Dinner at Fisherman\'s Wharf');
    [1, 2, 3, 4].forEach(u => insertSplit.run(exp2.lastInsertRowid, u, 300, 'pending'));

    // Expense 3: Amit paid 600 for Transport, only Amit and Neha split (300 each)
    let exp3 = insertExpense.run(groupId, 3, 600, 'Transport', 'Cab to airport');
    [3, 4].forEach(u => insertSplit.run(exp3.lastInsertRowid, u, 300, 'pending'));
    
    console.log('Seeding complete.');
  }
};

initDb();

module.exports = db;
