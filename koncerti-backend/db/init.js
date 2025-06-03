const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure db directory exists
const dbDirectory = path.join(__dirname);
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

// Initialize database
const db = new Database(path.join(dbDirectory, 'koncerti.db'));

// Create tables
function initializeDatabase() {
  // Create passes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS passes(
      passes_id INTEGER PRIMARY KEY AUTOINCREMENT,
      tier TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL
    );
  `);

  // Create orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders(
      order_id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      country_code TEXT DEFAULT '+62' NOT NULL,
      phone TEXT NOT NULL,
      nationality TEXT NOT NULL,
      place_of_residence TEXT NOT NULL,
      address TEXT NOT NULL,
      zip_code TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create order_details table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_details(
      od_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      passes_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(order_id),
      FOREIGN KEY (passes_id) REFERENCES passes(passes_id)
    );
  `);

  // Create tickets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets(
      ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
      od_id INTEGER NOT NULL,
      FOREIGN KEY (od_id) REFERENCES order_details(od_id)
    );
  `);

  // Check if passes already exist
  const existingPasses = db.prepare('SELECT COUNT(*) as count FROM passes').get();
  
  if (existingPasses.count === 0) {
    // Insert initial passes data
    const insertPass = db.prepare('INSERT INTO passes (tier, price, stock) VALUES (?, ?, ?)');
    
    const passesData = [
      ['General 3-Day', 430.00, 1000],
      ['General 1-Day', 150.00, 1000],
      ['VIP 3-Day', 650.00, 500],
      ['VIP 1-Day', 230.00, 500]
    ];
    
    passesData.forEach(pass => {
      insertPass.run(pass[0], pass[1], pass[2]);
    });
    
    console.log('Initial passes data inserted');
  }
}

// Run initialization
initializeDatabase();

// Export database connection
module.exports = db;