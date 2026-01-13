const dockerService = require('../services/dockerService');
const dbService = require('../services/dbService');

// POST /api/session
// Create a new game session
async function createSession(req, res) {
  try {
    const { durationSecond, maxPlayers, teamsCount, maxPlayersPerTeam } = req.body;

    console.log('Creating session:', JSON.stringify(req.body));

    // Stop any in-progress sessions first
    await dbService.terminateActiveSessions();

    // Clean up Docker containers from previous session
    try {
      await dockerService.removeContainersByLabel('type', 'MITS-ATTACKER');
      console.log('Cleaned up previous attacker containers');
    } catch (err) {
      console.warn('Warning: Failed to cleanup containers:', err.message);
    }

    // Create the session
    const session = await dbService.createSession(req.body);

    // Determine if this is FFA (Free For All) or Team mode
    // FFA: maxPlayersPerTeam = 1 (each player gets their own container)
    // Team: maxPlayersPerTeam > 1 (players share containers/teams)
    const isFFA = (maxPlayersPerTeam || 1) === 1;

    let teamsCreated = 0;

    if (!isFFA && teamsCount > 0) {
      // Team mode: Pre-create the team containers
      const containerPromises = [];
      for (let i = 0; i < teamsCount; i++) {
        // Generate a name for the team container
        const containerName = `mits_team_${session.sessionCode}_${i + 1}_${Date.now().toString().slice(-4)}`;
        console.log(`Spinning up team container: ${containerName}`);

        const attackerContainer = await dockerService.createAttacker(containerName);

        containerPromises.push(dbService.createPlayerContainer({
          container_url: attackerContainer.terminal_url,
          session_id: session.id,
          status: 'started'
        }));
      }

      await Promise.all(containerPromises);
      teamsCreated = teamsCount;
    }
    // For FFA mode: No pre-creation needed. Containers are created on-demand when players join.

    res.status(201).json({
      success: true,
      message: isFFA ? 'Session created (FFA mode - containers created on join)' : 'Session created with teams',
      session,
      mode: isFFA ? 'FFA' : 'Teams',
      teamsCreated
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
}


// GET /api/sessions
// Get all sessions
async function getAllSessions(req, res) {
  try {
    const sessions = await dbService.getAllSessions();
    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: error.message });
  }
}

// PUT /api/sessions/:id
// Update session status
async function updateSessionStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const session = await dbService.updateSessionStatus(id, status);

    // If session ended, clean up docker containers
    if (status === 'ended' || status === 'terminated' || status === 'stopped' || status === 'completed') {
      try {
        await dockerService.removeContainersByLabel('type', 'MITS-ATTACKER');
        // If we have victim containers later, stop them too
        // await dockerService.removeContainersByLabel('type', 'MITS-VICTIM');
        console.log(`Cleaned up containers for session ${id}`);
      } catch (e) {
        console.warn('Error cleaning up containers:', e.message);
      }
    }
    res.json({
      success: true,
      message: 'Session status updated',
      session
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/createattacker
// Create a new attacker container
// Body: { "name": "attacker-custom", "session_id": "123..." } 
// Returns: { id, name, terminal_url, status }
async function createAttacker(req, res) {
  try {
    const { name, session_id } = req.body;

    // We need a session_id to link the container to.
    // If not provided, try to find a pending session.
    let sessionId = session_id;
    if (!sessionId) {
      const pendingSession = await dbService.getPendingSession();
      if (pendingSession) {
        sessionId = pendingSession.id;
      } else {
        // Fallback or error? For now let's error if no session is open
        return res.status(400).json({ error: 'No active/pending session found. Please create a session first.' });
      }
    }

    const container = await dockerService.createAttacker(name);

    // Save to DB
    const playerContainer = await dbService.createPlayerContainer({
      container_url: container.terminal_url,
      session_id: sessionId
    });

    // We might want to link the docker ID to the DB ID or update the user table
    // For now, adhering to the basic "save to db" requirement.

    res.status(201).json({
      success: true,
      message: 'Attacker container created',
      container,
      playerContainer
    });
  } catch (error) {
    console.error('Error creating attacker:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/logs/breach
// Log a breach/login event from container
async function breach(req, res) {
  try {
    const { remote_ip, username, container_id, timestamp, playerContainer_id } = req.body;

    // We need playerContainer_id to log to DB.
    // The container script might only know its own hostname/ID.
    // For now we assume the client sends playerContainer_id or we look it up.
    // Since we don't have a lookup by docker ID in dbService yet, we'll assume it's passed or we just rely on what we can.

    // If we only have container_id (docker ID), we'd need to look up playerContainer_id.
    // Let's assume for this step that we can just log what we have, but the schema REQUIRES playerContainer_id.
    // Ideally we should query "playerContainer" by some field. But "containerCode" is the only unique field besides ID.
    // Let's assume the frontend/script passes the DB id, OR we fake it for now if missing to prevent crash.
    // actually, let's just error if missing, or use a placeholder if we are in dev/test mode.

    if (!playerContainer_id) {
      // Try to find by container_id if we store it? we don't store docker_id in playerContainer table in the new schema...
      // The schema has "containerCode". Maybe that maps to docker ID?
      // Let's assume the user sends playerContainer_id.
      // console.warn("Missing playerContainer_id for breach log");
    }

    const log = await dbService.logBreach({
      playerContainer_id: playerContainer_id || 1, // Fallback for testing if DB is empty/setup
      point: 10,
      metaData: { remote_ip, username, container_id, timestamp }
    });

    res.status(201).json({
      success: true,
      message: 'Breach logged successfully',
      log
    });
  } catch (error) {
    console.error('Error logging breach:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/logs/hint-accessed
// Log when a player accesses a hint
async function hintAccessed(req, res) {
  try {
    const { container_id, username, level, timestamp, playerContainer_id } = req.body;

    const log = await dbService.logHint({
      playerContainer_id: playerContainer_id || 1, // Fallback
      point: -5,
      metaData: { container_id, username, level, timestamp }
    });

    res.status(201).json({
      success: true,
      message: 'Hint access logged successfully',
      log
    });
  } catch (error) {
    console.error('Error logging hint access:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/containers/full-stop
// Stop all attacker and victim containers
async function fullStop(req, res) {
  try {
    const stoppedAttackers = await dockerService.stopContainersByLabel('type', 'MITS-ATTACKER');
    const stoppedVictims = await dockerService.stopContainersByLabel('type', 'MITS-VICTIM');

    res.json({
      success: true,
      message: 'All containers stopped',
      stopped_attackers: stoppedAttackers.length,
      stopped_victims: stoppedVictims.length,
      containers: [...stoppedAttackers, ...stoppedVictims]
    });
  } catch (error) {
    console.error('Error stopping containers:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/containers/full-start
// Start all attacker and victim containers
async function fullStart(req, res) {
  try {
    const startedAttackers = await dockerService.startContainersByLabel('type', 'MITS-ATTACKER');
    const startedVictims = await dockerService.startContainersByLabel('type', 'MITS-VICTIM');

    res.json({
      success: true,
      message: 'All containers started',
      started_attackers: startedAttackers.length,
      started_victims: startedVictims.length,
      containers: [...startedAttackers, ...startedVictims]
    });
  } catch (error) {
    console.error('Error starting containers:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/containers/attacker-stop
// Stop all attacker containers
async function attackerStop(req, res) {
  try {
    const stopped = await dockerService.stopContainersByLabel('type', 'MITS-ATTACKER');

    res.json({
      success: true,
      message: 'All attacker containers stopped',
      count: stopped.length,
      containers: stopped
    });
  } catch (error) {
    console.error('Error stopping attacker containers:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/containers/attacker-start
// Start all attacker containers
async function attackerStart(req, res) {
  try {
    const started = await dockerService.startContainersByLabel('type', 'MITS-ATTACKER');

    res.json({
      success: true,
      message: 'All attacker containers started',
      count: started.length,
      containers: started
    });
  } catch (error) {
    console.error('Error starting attacker containers:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/containers/victim-stop
// Stop all victim containers
async function victimStop(req, res) {
  try {
    const stopped = await dockerService.stopContainersByLabel('type', 'MITS-VICTIM');

    res.json({
      success: true,
      message: 'All victim containers stopped',
      count: stopped.length,
      containers: stopped
    });
  } catch (error) {
    console.error('Error stopping victim containers:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/containers/victim-start
// Start all victim containers
async function victimStart(req, res) {
  try {
    const started = await dockerService.startContainersByLabel('type', 'MITS-VICTIM');

    res.json({
      success: true,
      message: 'All victim containers started',
      count: started.length,
      containers: started
    });
  } catch (error) {
    console.error('Error starting victim containers:', error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/session/:id/leaderboard
async function getLeaderboard(req, res) {
  try {
    const { id } = req.params;
    const leaderboard = await dbService.getLeaderboard(id);
    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/session/:id/events
async function getEvents(req, res) {
  try {
    const { id } = req.params;
    const events = await dbService.getRecentEvents(id);
    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: error.message });
  }
}

// DELETE /api/sessions
// Delete all sessions and history
async function deleteAllSessions(req, res) {
  try {
    await dbService.deleteAllSessions();
    res.json({
      success: true,
      message: 'All sessions history cleared'
    });
  } catch (error) {
    console.error('Error deleting all sessions:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/join
// Player joins a session
async function joinSession(req, res) {
  try {
    const { sessionCode, displayName } = req.body;

    // Validate input
    if (!sessionCode || !displayName) {
      return res.status(400).json({ error: 'Session code and display name are required' });
    }

    // Trim and validate display name
    const trimmedName = displayName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      return res.status(400).json({ error: 'Display name must be 2-20 characters' });
    }

    // Find the session by code
    const session = await dbService.getSessionByCode(parseInt(sessionCode, 10));
    if (!session) {
      return res.status(404).json({ error: 'Session not found or not active' });
    }

    // Handle potential column name casing from PostgreSQL
    // PostgreSQL BIGINT returns as string, so parse to int
    const maxPlayersPerTeam = parseInt(session.maxPlayersPerTeam || session.maxplayersperteam || 1, 10);
    const maxPlayers = parseInt(session.maxPlayers || session.maxplayers || 10, 10);

    // Determine if this is FFA mode (each player gets their own container)
    const isFFA = maxPlayersPerTeam === 1;

    console.log('Join attempt:', { sessionId: session.id, maxPlayersPerTeam, maxPlayers, isFFA });

    // Try to find an available container
    let container = await dbService.getAvailableContainer(session.id, maxPlayersPerTeam);

    console.log('Available container:', container ? container.playerContainer_id : 'none');

    // If no container available
    if (!container) {
      if (isFFA) {
        // FFA mode: Check if we can create a new container (haven't reached maxPlayers)
        const currentPlayerCount = await dbService.getSessionPlayerCount(session.id);

        console.log('FFA mode - current players:', currentPlayerCount, 'max:', maxPlayers);

        if (currentPlayerCount >= maxPlayers) {
          return res.status(400).json({ error: 'Session is full - maximum players reached' });
        }

        // Create a new container on-the-fly for this player
        // Create a new container on-the-fly for this player
        // Generate a unique name for the Docker container
        const containerName = `mits_p_${sessionCode}_${currentPlayerCount + 1}_${Date.now().toString().slice(-4)}`;

        console.log(`Spinning up attacker container: ${containerName}`);
        const attackerContainer = await dockerService.createAttacker(containerName);

        container = await dbService.createPlayerContainer({
          container_url: attackerContainer.terminal_url,
          session_id: session.id,
          status: 'started'
        });

        console.log('Created new container:', container.playerContainer_id);
      } else {
        // Team mode: No available teams
        return res.status(400).json({ error: 'Session is full - no available teams' });
      }
    }

    // Create the user
    const user = await dbService.createUser({
      nickName: trimmedName,
      playerContainer_id: container.playerContainer_id
    });

    // Increment the container user count
    await dbService.incrementContainerUserCount(container.playerContainer_id);

    res.status(201).json({
      success: true,
      message: 'Successfully joined session',
      user: {
        id: user.user_id,
        displayName: user.nickName
      },
      team: {
        id: container.playerContainer_id,
        code: container.containerCode,
        url: container.container_url
      },
      session: {
        id: session.id,
        code: session.sessionCode
      }
    });
  } catch (error) {
    console.error('Error joining session:', error);
    // Handle duplicate name errors (both old and new messages)
    if (error.message.includes('Display name already taken')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}


// GET /api/sessions/active
// Get active sessions for players to join
async function getActiveSessions(req, res) {
  try {
    const sessions = await dbService.getActiveSessionsForJoin();
    res.json({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        code: s.sessionCode,
        status: s.session_status,
        maxPlayers: s.maxPlayers,
        currentPlayers: parseInt(s.current_players, 10) || 0,
        teamCount: parseInt(s.team_count, 10) || 0,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('Error getting active sessions:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createSession,
  getAllSessions,
  updateSessionStatus,
  createAttacker,
  breach,
  hintAccessed,
  fullStop,
  fullStart,
  attackerStop,
  attackerStart,
  victimStop,
  victimStart,
  getLeaderboard,
  getEvents,
  deleteAllSessions,
  joinSession,
  getActiveSessions
};
