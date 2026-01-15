const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');
const authController = require('../controllers/authController');

// --- Auth Routes ---
router.post('/auth/login', authController.login);

// --- Session Routes ---

// GET /api
// Health check
router.get('/', (req, res) => {
  res.json({ message: 'Hello World! API is running' });
});

// POST /api/session
// Create a new game session
router.post('/session', controller.createSession);

// GET /api/sessions
// Get all sessions
router.get('/sessions', controller.getAllSessions);

// GET /api/sessions/active
// Get active sessions for players to join
router.get('/sessions/active', controller.getActiveSessions);

// DELETE /api/sessions
// Clear all session history
router.delete('/sessions', controller.deleteAllSessions);

// PUT /api/sessions/:id/status
// Update session status
router.put('/sessions/:id/status', controller.updateSessionStatus);

// GET /api/sessions/:id/leaderboard
router.get('/sessions/:id/leaderboard', controller.getLeaderboard);

// GET /api/sessions/:id/points-distribution
router.get('/sessions/:id/points-distribution', controller.getPointsDistribution);

// GET /api/sessions/:id/events
router.get('/sessions/:id/events', controller.getEvents);

// POST /api/join
// Player joins a session
router.post('/join', controller.joinSession);

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
