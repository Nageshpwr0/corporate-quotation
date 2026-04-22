const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, 'quotations.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerName TEXT NOT NULL UNIQUE,
      address TEXT,
      contactNo TEXT,
      email TEXT,
      kindAttentionName TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  // Backward-compatible migration for older DBs that only had customerName.
  // SQLite may throw "duplicate column name" if already present; that can be safely ignored.
  db.run('ALTER TABLE customers ADD COLUMN address TEXT', () => {});
  db.run('ALTER TABLE customers ADD COLUMN contactNo TEXT', () => {});
  db.run('ALTER TABLE customers ADD COLUMN email TEXT', () => {});
  db.run('ALTER TABLE customers ADD COLUMN kindAttentionName TEXT', () => {});

  db.run(`
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productType TEXT NOT NULL,
      inputs TEXT NOT NULL,
      rows TEXT NOT NULL,
      totalAmount REAL NOT NULL,
      ratePerPiece REAL,
      results TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert sample customers
  const insertCustomer = db.prepare(`
    INSERT OR IGNORE INTO customers (customerName, address, contactNo, email, kindAttentionName)
    VALUES (?, ?, ?, ?, ?)
  `);
  ['ABC Corporation', 'XYZ Industries', 'Tech Solutions Ltd'].forEach(name => {
    insertCustomer.run(name, '', '', '', '');
  });
  insertCustomer.finalize();
});

module.exports = db;
