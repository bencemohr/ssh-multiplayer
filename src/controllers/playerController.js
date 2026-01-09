const playerService = require('../services/playerService');
const sessionService = require('../services/sessionService');

/**
 * POST /api/sessions/:sessionCode/join
 * Join a player to a session
 */
async function joinSession(req, res) {
  try {
    const { sessionCode } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const player = await playerService.joinPlayer(sessionCode, username);

    res.status(201).json({
      success: true,
      message: 'Successfully joined session',
      player
    });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * GET /api/sessions/:sessionId/players
 * Get all players in a session
 */
async function getSessionPlayers(req, res) {
  try {
    const { sessionId } = req.params;

    const players = await playerService.getSessionPlayers(sessionId);

    res.json({
      success: true,
      count: players.length,
      players
    });
  } catch (error) {
    console.error('Error getting players:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * DELETE /api/players/:playerId
 * Remove a player from session
 */
async function removePlayer(req, res) {
  try {
    const { playerId } = req.params;

    const removedPlayer = await playerService.removePlayer(playerId);

    res.json({
      success: true,
      message: 'Player removed from session',
      player: removedPlayer
    });
  } catch (error) {
    console.error('Error removing player:', error);
    res.status(404).json({ error: error.message });
  }
}

module.exports = {
  joinSession,
  getSessionPlayers,
  removePlayer
};
