const pool = require('../db/db');
const crypto = require('crypto');

/**
 * Generate a random session code (6-character alphanumeric)
 */
function generateSessionCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

/**
 * Create a new game session
 */
async function createSession(data) {
  const {
    max_players,
    time_limit,
    selected_levels,
    admin_id,
    mode,
    team_size
  } = data;

  const sessionCode = generateSessionCode();
  const query = `
    INSERT INTO sessions 
    (session_code, admin_id, max_players, time_limit, selected_levels, mode, team_size, status, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [
      sessionCode,
      admin_id,
      max_players,
      time_limit,
      JSON.stringify(selected_levels),
      mode || 'single',
      team_size || 1,
      'lobby'
    ]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }
}

/**
 * Get session by code
 */
async function getSessionByCode(sessionCode) {
  const query = `
    SELECT * FROM sessions 
    WHERE session_code = $1;
  `;

  try {
    const result = await pool.query(query, [sessionCode]);
    if (result.rows.length === 0) {
      throw new Error('Session not found');
    }
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to get session: ${error.message}`);
  }
}

/**
 * Get session by ID
 */
async function getSessionById(sessionId) {
  const query = `
    SELECT * FROM sessions 
    WHERE id = $1;
  `;

  try {
    const result = await pool.query(query, [sessionId]);
    if (result.rows.length === 0) {
      throw new Error('Session not found');
    }
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to get session: ${error.message}`);
  }
}

/**
 * Update session status
 */
async function updateSessionStatus(sessionId, newStatus) {
  const validStatuses = ['lobby', 'active', 'finished'];
  if (!validStatuses.includes(newStatus)) {
    throw new Error('Invalid status');
  }

  const query = `
    UPDATE sessions 
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [newStatus, sessionId]);
    if (result.rows.length === 0) {
      throw new Error('Session not found');
    }
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to update session: ${error.message}`);
  }
}

/**
 * Get all sessions (for admin panel)
 */
async function getAllSessions(adminId = null) {
  let query = `
    SELECT * FROM sessions 
    ORDER BY created_at DESC;
  `;

  if (adminId) {
    query = `
      SELECT * FROM sessions 
      WHERE admin_id = $1
      ORDER BY created_at DESC;
    `;
  }

  try {
    const result = adminId ? 
      await pool.query(query, [adminId]) : 
      await pool.query(query);
    return result.rows;
  } catch (error) {
    throw new Error(`Failed to get sessions: ${error.message}`);
  }
}

/**
 * Delete session
 */
async function deleteSession(sessionId) {
  const query = `
    DELETE FROM sessions 
    WHERE id = $1
    RETURNING *;
  `;

  try {
    const result = await pool.query(query, [sessionId]);
    if (result.rows.length === 0) {
      throw new Error('Session not found');
    }
    return result.rows[0];
  } catch (error) {
    throw new Error(`Failed to delete session: ${error.message}`);
  }
}

module.exports = {
  generateSessionCode,
  createSession,
  getSessionByCode,
  getSessionById,
  updateSessionStatus,
  getAllSessions,
  deleteSession
};
