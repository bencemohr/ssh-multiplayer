const teamService = require('../services/teamService');
const sessionService = require('../services/sessionService');

/**
 * POST /api/sessions/:sessionId/assign-teams
 * Assign players to teams (called when ready to start game)
 */
async function assignTeams(req, res) {
  try {
    const { sessionId } = req.params;

    const teams = await teamService.assignTeams(sessionId);

    res.status(201).json({
      success: true,
      message: 'Teams assigned successfully',
      teams_count: teams.length,
      teams
    });
  } catch (error) {
    console.error('Error assigning teams:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * GET /api/sessions/:sessionId/teams
 * Get team assignments for a session
 */
async function getTeams(req, res) {
  try {
    const { sessionId } = req.params;

    const teams = await teamService.getSessionTeams(sessionId);

    res.json({
      success: true,
      teams_count: teams.length,
      teams
    });
  } catch (error) {
    console.error('Error getting teams:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/teams/:teamId
 * Get team details
 */
async function getTeam(req, res) {
  try {
    const { teamId } = req.params;

    const team = await teamService.getTeamById(teamId);

    res.json({
      success: true,
      team
    });
  } catch (error) {
    console.error('Error getting team:', error);
    res.status(404).json({ error: error.message });
  }
}

module.exports = {
  assignTeams,
  getTeams,
  getTeam
};
