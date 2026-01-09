const pool = require('../db/db');
const dockerService = require('./dockerService');

/**
 * Assign players to balanced teams
 * Distributes players evenly across teams based on team_size
 */
async function assignTeams(sessionId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get session info
    const sessionResult = await client.query(
      'SELECT team_size, selected_levels FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Session not found');
    }

    const { team_size, selected_levels } = sessionResult.rows[0];

    // Get all players in session
    const playersResult = await client.query(
      'SELECT id FROM players WHERE session_id = $1 ORDER BY joined_at ASC',
      [sessionId]
    );

    const players = playersResult.rows;
    if (players.length === 0) {
      throw new Error('No players in session');
    }

    // Calculate number of teams needed
    const numTeams = Math.ceil(players.length / team_size);
    const teams = [];

    // Create teams and assign players
    for (let i = 0; i < numTeams; i++) {
      // Create team
      const teamResult = await client.query(
        'INSERT INTO teams (session_id, team_number, status) VALUES ($1, $2, $3) RETURNING id',
        [sessionId, i + 1, 'created']
      );

      const teamId = teamResult.rows[0].id;
      teams.push({ id: teamId, teamNumber: i + 1, players: [] });

      // Assign players to this team (balanced distribution)
      const startIdx = i * team_size;
      const endIdx = Math.min(startIdx + team_size, players.length);

      for (let j = startIdx; j < endIdx; j++) {
        await client.query(
          'INSERT INTO team_members (team_id, player_id) VALUES ($1, $2)',
          [teamId, players[j].id]
        );
        teams[i].players.push(players[j].id);
      }
    }

    // Create attacker container for each team
    for (const team of teams) {
      const containerName = `team-${sessionId}-${team.teamNumber}`;
      const container = await dockerService.createAttacker(containerName);

      // Update team with container info
      await client.query(
        `UPDATE teams 
         SET container_id = $1, container_port = $2, container_hostname = $3, container_url = $4, status = $5
         WHERE id = $6`,
        [
          container.id,
          container.port,
          container.hostname,
          container.terminal_url,
          'stopped',
          team.id
        ]
      );
    }

    await client.query('COMMIT');

    // Return team assignments
    const teamsResult = await client.query(
      `SELECT t.id, t.team_number, t.container_url, 
              array_agg(p.username) as players
       FROM teams t
       LEFT JOIN team_members tm ON t.id = tm.team_id
       LEFT JOIN players p ON tm.player_id = p.id
       WHERE t.session_id = $1
       GROUP BY t.id
       ORDER BY t.team_number ASC`,
      [sessionId]
    );

    return teamsResult.rows;
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`Failed to assign teams: ${error.message}`);
  } finally {
    client.release();
  }
}

/**
 * Get teams for a session
 */
async function getSessionTeams(sessionId) {
  const query = `
    SELECT t.id, t.team_number, t.container_id, t.container_url, t.status,
           array_agg(p.username) as players,
           array_agg(p.id) as player_ids
    FROM teams t
    LEFT JOIN team_members tm ON t.id = tm.team_id
    LEFT JOIN players p ON tm.player_id = p.id
    WHERE t.session_id = $1
    GROUP BY t.id
    ORDER BY t.team_number ASC;
  `;

  try {
    const result = await pool.query(query, [sessionId]);
    return result.rows;
  } catch (error) {
    throw new Error(`Failed to get teams: ${error.message}`);
  }
}

/**
 * Get team by ID with members
 */
async function getTeamById(teamId) {
  const query = `
    SELECT t.id, t.session_id, t.team_number, t.container_id, t.container_url, t.status,
           array_agg(json_build_object('id', p.id, 'username', p.username)) as members
    FROM teams t
    LEFT JOIN team_members tm ON t.id = tm.team_id
    LEFT JOIN players p ON tm.player_id = p.id
    WHERE t.id = $1
    GROUP BY t.id;
  `;

  try {
    const result = await pool.query(query, [teamId]);
    if (result.rows.length === 0) {
      throw new Error('Team not found');
    }
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to get team: ${error.message}`);
  }
}

/**
 * Start containers for all teams in a session
 */
async function startSessionTeamContainers(sessionId) {
  try {
    const teamsResult = await pool.query(
      'SELECT id, container_id FROM teams WHERE session_id = $1',
      [sessionId]
    );

    const startedContainers = [];

    for (const team of teamsResult.rows) {
      if (team.container_id) {
        try {
          // Start the container via docker
          const docker = require('../db/docker');
          const container = docker.getContainer(team.container_id);
          await container.start();

          // Update team status
          await pool.query(
            'UPDATE teams SET status = $1 WHERE id = $2',
            ['running', team.id]
          );

          startedContainers.push(team.id);
        } catch (error) {
          console.error(`Failed to start container for team ${team.id}:`, error);
        }
      }
    }

    return startedContainers;
  } catch (error) {
    throw new Error(`Failed to start team containers: ${error.message}`);
  }
}

/**
 * Stop containers for all teams in a session
 */
async function stopSessionTeamContainers(sessionId) {
  try {
    const teamsResult = await pool.query(
      'SELECT id, container_id FROM teams WHERE session_id = $1',
      [sessionId]
    );

    const stoppedContainers = [];

    for (const team of teamsResult.rows) {
      if (team.container_id) {
        try {
          const docker = require('../db/docker');
          const container = docker.getContainer(team.container_id);
          await container.stop();

          // Update team status
          await pool.query(
            'UPDATE teams SET status = $1 WHERE id = $2',
            ['stopped', team.id]
          );

          stoppedContainers.push(team.id);
        } catch (error) {
          console.error(`Failed to stop container for team ${team.id}:`, error);
        }
      }
    }

    return stoppedContainers;
  } catch (error) {
    throw new Error(`Failed to stop team containers: ${error.message}`);
  }
}

module.exports = {
  assignTeams,
  getSessionTeams,
  getTeamById,
  startSessionTeamContainers,
  stopSessionTeamContainers
};
