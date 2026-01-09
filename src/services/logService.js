const pool = require('../db/db');

/**
 * Log a breach/login event
 */
async function logBreach(data) {
  const {
    session_id,
    player_id,
    container_id,
    username,
    remote_ip,
    level,
    timestamp
  } = data;

  const query = `
    INSERT INTO breaches 
    (session_id, player_id, container_id, username, remote_ip, level, timestamp, logged_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [
      session_id,
      player_id,
      container_id,
      username,
      remote_ip,
      level,
      timestamp
    ]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to log breach: ${error.message}`);
  }
}

/**
 * Log hint access
 */
async function logHintAccess(data) {
  const {
    session_id,
    player_id,
    container_id,
    username,
    level,
    timestamp
  } = data;

  const query = `
    INSERT INTO hint_logs 
    (session_id, player_id, container_id, username, level, timestamp, logged_at)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [
      session_id,
      player_id,
      container_id,
      username,
      level,
      timestamp
    ]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to log hint access: ${error.message}`);
  }
}

/**
 * Get breaches for a session
 */
async function getSessionBreaches(sessionId) {
  const query = `
    SELECT * FROM breaches 
    WHERE session_id = $1
    ORDER BY logged_at DESC;
  `;

  try {
    const result = await pool.query(query, [sessionId]);
    return result.rows;
  } catch (error) {
    throw new Error(`Failed to get breaches: ${error.message}`);
  }
}

/**
 * Get breaches for a player
 */
async function getPlayerBreaches(playerId) {
  const query = `
    SELECT * FROM breaches 
    WHERE player_id = $1
    ORDER BY logged_at DESC;
  `;

  try {
    const result = await pool.query(query, [playerId]);
    return result.rows;
  } catch (error) {
    throw new Error(`Failed to get player breaches: ${error.message}`);
  }
}

/**
 * Get hint logs for a session
 */
async function getSessionHintLogs(sessionId) {
  const query = `
    SELECT * FROM hint_logs 
    WHERE session_id = $1
    ORDER BY logged_at DESC;
  `;

  try {
    const result = await pool.query(query, [sessionId]);
    return result.rows;
  } catch (error) {
    throw new Error(`Failed to get hint logs: ${error.message}`);
  }
}

module.exports = {
  logBreach,
  logHintAccess,
  getSessionBreaches,
  getPlayerBreaches,
  getSessionHintLogs
};
