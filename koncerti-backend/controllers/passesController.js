const db = require('../db/init');

// Get all passes
const getAllPasses = (req, res) => {
  try {
    const passes = db.prepare('SELECT * FROM passes').all();
    res.status(200).json(passes);
  } catch (error) {
    console.error('Error fetching passes:', error);
    res.status(500).json({ message: 'Failed to fetch passes' });
  }
};

// Get a single pass by ID
const getPassById = (req, res) => {
  try {
    const { id } = req.params;
    const pass = db.prepare('SELECT * FROM passes WHERE passes_id = ?').get(id);
    
    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }
    
    res.status(200).json(pass);
  } catch (error) {
    console.error('Error fetching pass:', error);
    res.status(500).json({ message: 'Failed to fetch pass' });
  }
};

module.exports = {
  getAllPasses,
  getPassById
};