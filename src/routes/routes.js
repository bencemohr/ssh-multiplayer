const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');

// Hello World route - returns a simple greeting
// GET /api
router.get('/', (req, res) => {
  res.json({ message: 'Hello World! API is running' });
});

// POST /api/createattacker
// Create a new attacker container
// Optional body: { "name": "attacker-custom-name" }
router.post('/createattacker', controller.createAttacker);

// GET /api/containers/:id/terminal
// Get terminal URL for a container
router.get('/containers/:id/terminal', controller.getTerminal);

module.exports = router;
