const express = require('express');
const router = express.Router();
const { getAllPasses, getPassById } = require('../controllers/passesController');

// Get all passes
router.get('/', getAllPasses);

// Get pass by ID
router.get('/:id', getPassById);

module.exports = router;