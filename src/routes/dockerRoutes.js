const express = require('express');
const router = express.Router();
const dockerController = require('../controllers/dockerController');

// Hello World route - returns a simple greeting
// GET /api
router.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

// Add more routes below...

module.exports = router;
