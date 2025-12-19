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

// POST /api/breach
// Log a breach/login event from container
router.post('/breach', controller.breach);

// POST /api/logs/hint-accessed
// Log when a player accesses a hint
router.post('/logs/hint-accessed', controller.hintAccessed);

module.exports = router;
