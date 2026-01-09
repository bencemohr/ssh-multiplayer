const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller');
const sessionController = require('../controllers/sessionController');
const playerController = require('../controllers/playerController');

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

// ========================================
// Session Management Endpoints
// ========================================

// POST /api/sessions - create a new session
router.post('/sessions', sessionController.createSession);

// GET /api/sessions - get all sessions (with optional admin_id filter)
router.get('/sessions', sessionController.getAllSessions);

// GET /api/sessions/:sessionCode - get session by code
router.get('/sessions/:sessionCode', sessionController.getSession);

// PATCH /api/sessions/:sessionId/status - update session status
router.patch('/sessions/:sessionId/status', sessionController.updateSessionStatus);

// DELETE /api/sessions/:sessionId - delete a session
router.delete('/sessions/:sessionId', sessionController.deleteSession);

// ========================================
// Player Management Endpoints
// ========================================

// POST /api/sessions/:sessionCode/join - join player to session
router.post('/sessions/:sessionCode/join', playerController.joinSession);

// GET /api/sessions/:sessionId/players - get all players in session
router.get('/sessions/:sessionId/players', playerController.getSessionPlayers);

// DELETE /api/players/:playerId - remove player from session
router.delete('/players/:playerId', playerController.removePlayer);

module.exports = router;
