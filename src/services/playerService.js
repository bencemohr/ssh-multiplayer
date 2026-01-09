const pool = require('../db/db');

/**
 * Join a player to a session
 */
async function joinPlayer(sessionCode, username) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get session
    const sessionResult = await client.query(
      'SELECT id, max_players, status FROM sessions WHERE session_code = $1',
      [sessionCode]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Session not found');
    }

    const session = sessionResult.rows[0];

    // Check if session is in lobby state
    if (session.status !== 'lobby') {
      throw new Error('Cannot join: session is not in lobby state');
    }

    // Check player count
    const playerCountResult = await client.query(
      'SELECT COUNT(*) as count FROM players WHERE session_id = $1',
      [session.id]
    );

    const currentPlayers = parseInt(playerCountResult.rows[0].count);
    if (currentPlayers >= session.max_players) {
      throw new Error('Session is full');
    }

    // Check if username already exists in this session
    const existingResult = await client.query(
      'SELECT id FROM players WHERE session_id = $1 AND username = $2',
      [session.id, username]
    );

    if (existingResult.rows.length > 0) {
      throw new Error('Username already taken in this session');
    }

    // Insert player
    const playerResult = await client.query(
      `INSERT INTO players 
       (session_id, username, joined_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       RETURNING *;`,
      [session.id, username]
    );

    await client.query('COMMIT');
    return playerResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`Failed to join player: ${error.message}`);
  } finally {
    client.release();
  }
}

/**
 * Get all players in a session
 */
async function getSessionPlayers(sessionId) {
  const query = `
    SELECT id, username, joined_at FROM players 
    WHERE session_id = $1
    ORDER BY joined_at ASC;
  `;

  try {
    const result = await pool.query(query, [sessionId]);
    return result.rows;
  } catch (error) {
    throw new Error(`Failed to get players: ${error.message}`);
  }
}

/**
 * Remove a player from session
 */
async function removePlayer(playerId) {
  const query = `
    DELETE FROM players 
    WHERE id = $1
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [playerId]);
    if (result.rows.length === 0) {
      throw new Error('Player not found');
    }
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to remove player: ${error.message}`);
  }
}

/**
 * Get player by ID
 */
async function getPlayerById(playerId) {
  const query = `
    SELECT * FROM players 
    WHERE id = $1;
  `;

  try {
    const result = await pool.query(query, [playerId]);
    if (result.rows.length === 0) {
      throw new Error('Player not found');
    }
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to get player: ${error.message}`);
  }
}

module.exports = {
  joinPlayer,
  getSessionPlayers,
  removePlayer,
  getPlayerById
};
