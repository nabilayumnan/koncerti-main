const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize database
require('./db/init');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const passesRoutes = require('./routes/passes');
const ordersRoutes = require('./routes/order');

// Use routes
app.use('/api/passes', passesRoutes);
app.use('/api/orders', ordersRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Koncerti API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Update the CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Add this to your server.js temporarily for testing
const db = require('./db/init');

// Test direct database access
try {
  // Test insert
  const testInsert = db.prepare('INSERT INTO passes (tier, price, stock) VALUES (?, ?, ?)');
  testInsert.run('Test Pass', 99.99, 100);
  
  // Test select
  const passes = db.prepare('SELECT * FROM passes').all();
  console.log('Database test - passes:', passes);
} catch (error) {
  console.error('Database test failed:', error);
}