const sessionService = require('../services/sessionService');
const teamService = require('../services/teamService');

/**
 * POST /api/sessions
 * Create a new game session
 */
async function createSession(req, res) {
  try {
    const { max_players, time_limit, selected_levels, admin_id, mode, team_size } = req.body;

    if (!max_players || !time_limit || !selected_levels || !admin_id) {
      return res.status(400).json({
        error: 'Missing required fields: max_players, time_limit, selected_levels, admin_id'
      });
    }

    const sessionMode = mode || 'single';
    const finalTeamSize = team_size || (sessionMode === 'single' ? 1 : Math.ceil(max_players / 2));

    const session = await sessionService.createSession({
      max_players,
      time_limit,
      selected_levels,
      admin_id,
      mode: sessionMode,
      team_size: finalTeamSize
    });

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      session
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/sessions/:sessionCode
 * Get session details by code
 */
async function getSession(req, res) {
  try {
    const { sessionCode } = req.params;

    const session = await sessionService.getSessionByCode(sessionCode);

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(404).json({ error: error.message });
  }
}

/**
 * GET /api/sessions
 * Get all sessions (with optional admin filter)
 */
async function getAllSessions(req, res) {
  try {
    const { admin_id } = req.query;

    const sessions = await sessionService.getAllSessions(admin_id);

    res.json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * PATCH /api/sessions/:sessionId/status
 * Update session status
 */
async function updateSessionStatus(req, res) {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updatedSession = await sessionService.updateSessionStatus(sessionId, status);

    // If transitioning to "active", assign teams and start containers
    if (status === 'active') {
      try {
        // Assign players to teams
        const teams = await teamService.assignTeams(sessionId);
        
        // Start team containers
        await teamService.startSessionTeamContainers(sessionId);

        return res.json({
          success: true,
          message: `Session status updated to ${status}`,
          session: updatedSession,
          teams_count: teams.length,
          teams
        });
      } catch (teamError) {
        console.error('Error setting up teams:', teamError);
        return res.status(400).json({
          error: `Status updated but team setup failed: ${teamError.message}`
        });
      }
    }

    // If transitioning to "finished", stop containers
    if (status === 'finished') {
      try {
        await teamService.stopSessionTeamContainers(sessionId);
      } catch (stopError) {
        console.error('Error stopping containers:', stopError);
      }
    }

    res.json({
      success: true,
      message: `Session status updated to ${status}`,
      session: updatedSession
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * DELETE /api/sessions/:sessionId
 * Delete a session
 */
async function deleteSession(req, res) {
  try {
    const { sessionId } = req.params;

    const deletedSession = await sessionService.deleteSession(sessionId);

    res.json({
      success: true,
      message: 'Session deleted',
      session: deletedSession
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(404).json({ error: error.message });
  }
}

module.exports = {
  createSession,
  getSession,
  getAllSessions,
  updateSessionStatus,
  deleteSession
};
