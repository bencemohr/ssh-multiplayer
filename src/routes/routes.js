const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');

// GET /api
// Health check
router.get('/', (req, res) => {
  res.json({ message: 'Hello World! API is running' });
});

// POST /api/createattacker
// Create a new attacker container
router.post('/createattacker', controller.createAttacker);

// POST /api/logs/breach
// Log a breach/login event from container
router.post('/logs/breach', controller.breach);

// POST /api/logs/hint-accessed
// Log when a player accesses a hint
router.post('/logs/hint-accessed', controller.hintAccessed);

// Container lifecycle management
// POST /api/containers/full-stop - stop all containers
router.post('/containers/full-stop', controller.fullStop);

// POST /api/containers/full-start - start all containers
router.post('/containers/full-start', controller.fullStart);

// POST /api/containers/attacker-stop - stop all attacker containers
router.post('/containers/attacker-stop', controller.attackerStop);

// POST /api/containers/attacker-start - start all attacker containers
router.post('/containers/attacker-start', controller.attackerStart);

// POST /api/containers/victim-stop - stop all victim containers
router.post('/containers/victim-stop', controller.victimStop);

// POST /api/containers/victim-start - start all victim containers
router.post('/containers/victim-start', controller.victimStart);

module.exports = router;
