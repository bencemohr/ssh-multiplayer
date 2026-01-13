const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Helper to generate a random BIGINT-compatible ID
// Since JS doesn't support 64-bit int literals directly in old versions,
// we'll use a string or a careful combination of timestamp + random
function generateId() {
    // Use timestamp (ms) + random 4 digit number
    // safe up to Number.MAX_SAFE_INTEGER (2^53 - 1)
    const timestamp = Date.now(); // 13 digits
    const random = Math.floor(Math.random() * 10000); // 4 digits
    // Total ~17 digits, fits in BIGINT (signed 64-bit max is ~19 digits)
    return BigInt(`${timestamp}${random.toString().padStart(4, '0')}`);
}

async function query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
        console.log('executed query', { text, duration, rows: res.rowCount });
    }
    return res;
}

// --- Session Management ---

async function createSession(data) {
    const id = generateId();
    const sessionCode = Math.floor(100000 + Math.random() * 900000); // 6 digit code

    const queryText = `
    INSERT INTO "session" (
      "id", "sessionCode", "durationSecond", "maxPlayers", 
      "session_status", "selectedLevels", "totalFlag_count", 
      "maxPlayersPerTeam", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING *
  `;

    const values = [
        id,
        sessionCode,
        data.durationSecond || 3600,
        data.maxPlayers || 10,
        'pending', // Initial status
        data.selectedLevels || 'level1,level2',
        data.totalFlag_count || 10,
        data.maxPlayersPerTeam || 1
    ];

    try {
        const res = await query(queryText, values);
        return res.rows[0];
    } catch (err) {
        console.error('Error creating session', err);
        throw err;
    }
}

async function getSession(id) {
    const res = await query('SELECT * FROM "session" WHERE id = $1', [id]);
    return res.rows[0];
}

async function getAllSessions() {
    const res = await query('SELECT * FROM "session" ORDER BY "createdAt" DESC', []);
    return res.rows;
}

async function updateSessionStatus(id, status) {
    const res = await query('UPDATE "session" SET "session_status" = $1 WHERE id = $2 RETURNING *', [status, id]);
    return res.rows[0];
}

async function getPendingSession() {
    // Basic logic: find the most recent pending session
    // In a real app, the user might select which session to join via code
    const res = await query('SELECT * FROM "session" WHERE session_status = $1 ORDER BY "createdAt" DESC LIMIT 1', ['pending']);
    return res.rows[0];
}

async function terminateActiveSessions() {
    // Set all pending or active sessions to 'completed'
    const queryText = `
      UPDATE "session" 
      SET "session_status" = 'completed' 
      WHERE "session_status" IN ('pending', 'active')
    `;
    try {
        await query(queryText);
    } catch (err) {
        console.error('Error terminating active sessions', err);
        throw err;
    }
}

// --- Player Container Management ---

async function createPlayerContainer(data) {
    const id = generateId();
    const containerCode = Math.floor(10000000 + Math.random() * 90000000); // 8 digit code

    const queryText = `
    INSERT INTO "playerContainer" (
      "playerContainer_id", "containerCode", "container_url", 
      "userConnected_count", "session_id", "totalScore", 
      "containerStatus"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

    const values = [
        id,
        containerCode,
        data.container_url,
        0, // userConnected_count
        data.session_id,
        0, // totalScore
        data.status || 'creating'
    ];

    try {
        const res = await query(queryText, values);
        return res.rows[0];
    } catch (err) {
        console.error('Error creating playerContainer', err);
        throw err;
    }
}

async function updateContainerStatus(id, status) {
    const queryText = 'UPDATE "playerContainer" SET "containerStatus" = $1 WHERE "playerContainer_id" = $2 RETURNING *';
    try {
        const res = await query(queryText, [status, id]);
        return res.rows[0];
    } catch (err) {
        console.error('Error updating container status', err);
        throw err;
    }
}

// --- Event Logging ---

async function logBreach(data) {
    const id = generateId();

    const queryText = `
    INSERT INTO "container_logs" (
      "container_logs_id", "event_type", "playerContainer_id", "metaData", "point"
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

    const values = [
        id,
        'foundFlag_accepted', // Defaulting to this for "breach"
        data.playerContainer_id,
        data.metaData || {},
        data.point || 10
    ];

    try {
        const res = await query(queryText, values);

        // Update totalScore in playerContainer
        await query(
            'UPDATE "playerContainer" SET "totalScore" = "totalScore" + $1 WHERE "playerContainer_id" = $2',
            [values[4], data.playerContainer_id]
        );

        return res.rows[0];
    } catch (err) {
        console.error('Error logging breach', err);
        throw err;
    }
}

async function logHint(data) {
    const id = generateId();

    const queryText = `
    INSERT INTO "container_logs" (
      "container_logs_id", "event_type", "playerContainer_id", "metaData", "point"
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

    const values = [
        id,
        'hint_requested',
        data.playerContainer_id,
        data.metaData || {},
        data.point || -5 // Negative points for hints usually
    ];

    try {
        const res = await query(queryText, values);

        // Update totalScore in playerContainer
        await query(
            'UPDATE "playerContainer" SET "totalScore" = "totalScore" + $1 WHERE "playerContainer_id" = $2',
            [values[4], data.playerContainer_id]
        );

        return res.rows[0];
    } catch (err) {
        console.error('Error logging hint', err);
        throw err;
    }
}

async function getAdminByNickname(nickname) {
    const res = await query('SELECT * FROM "admin" WHERE "nickName" = $1', [nickname]);
    return res.rows[0];
}

async function getLeaderboard(sessionId) {
    // If sessionId is null, get for the active session or return empty
    if (!sessionId) {
        const session = await getPendingSession();
        if (session) sessionId = session.id;
    }

    // Get session to determine mode (FFA vs Teams)
    const sessionRes = await query('SELECT "maxPlayersPerTeam" FROM "session" WHERE "id" = $1', [sessionId]);
    const maxPlayersPerTeam = sessionRes.rows[0] ? parseInt(sessionRes.rows[0].maxPlayersPerTeam, 10) : 1;
    const isFFA = maxPlayersPerTeam === 1;

    // Query to get leaderboard with player names
    // For FFA: Get the user's nickName
    // For Teams: We'll generate Team A, B, C on the frontend based on position
    const queryText = `
      SELECT 
        pc."playerContainer_id", 
        pc."containerCode", 
        pc."totalScore", 
        pc."containerStatus", 
        pc."userConnected_count" as participants,
        (SELECT COUNT(*) FROM "container_logs" WHERE "playerContainer_id" = pc."playerContainer_id" AND "event_type" = 'level_completed') as levels_completed,
        (SELECT STRING_AGG(u."nickName", ', ') FROM "user" u WHERE u."playerContainer_id" = pc."playerContainer_id") as player_names
      FROM "playerContainer" pc
      WHERE pc."session_id" = $1
      ORDER BY pc."totalScore" DESC
    `;
    const res = await query(queryText, [sessionId]);

    // Add mode info and generate team names
    const leaderboard = res.rows.map((row, index) => ({
        ...row,
        isFFA,
        teamLetter: String.fromCharCode(65 + index), // A, B, C, D...
        displayName: isFFA
            ? (row.player_names || `Player ${index + 1}`)
            : `Team ${String.fromCharCode(65 + index)}`
    }));

    return leaderboard;
}


async function getRecentEvents(sessionId) {
    const queryText = `
      SELECT cl.*, pc."containerCode"
      FROM "container_logs" cl
      JOIN "playerContainer" pc ON cl."playerContainer_id" = pc."playerContainer_id"
      WHERE pc."session_id" = $1
      ORDER BY cl."createdAt" DESC
      LIMIT 20
    `;
    const res = await query(queryText, [sessionId]);
    return res.rows;
}

async function deleteAllSessions() {
    // TRUNCATE is faster and cleaner for "clearing all history"
    // CASCADE ensuring all dependent tables (playerContainer, logs) are also cleared if FKs exist
    // If not, we might need to delete from them first. assuming CASCADE works or we want to try generic delete.
    // Let's use DELETE FROM "session" to be safe(er) about triggers, but TRUNCATE is better for IDs.
    // The user asked to "clear all session history".
    const queryText = 'TRUNCATE TABLE "session" CASCADE';
    try {
        await query(queryText);
        return true;
    } catch (err) {
        console.error('Error deleting all sessions', err);
        throw err;
    }
}

// --- Player Join Functions ---

async function getSessionByCode(sessionCode) {
    // Find a session by its 6-digit code that is pending or active
    const queryText = `
      SELECT * FROM "session" 
      WHERE "sessionCode" = $1 
      AND "session_status" IN ('pending', 'active')
    `;
    try {
        const res = await query(queryText, [sessionCode]);
        return res.rows[0];
    } catch (err) {
        console.error('Error getting session by code', err);
        throw err;
    }
}

async function getAvailableContainer(sessionId, maxPlayersPerTeam) {
    // Find a container that has room for more players
    const queryText = `
      SELECT * FROM "playerContainer" 
      WHERE "session_id" = $1 
      AND "userConnected_count" < $2
      AND "containerStatus" IN ('started', 'healthy', 'creating')
      ORDER BY "userConnected_count" ASC
      LIMIT 1
    `;
    try {
        const res = await query(queryText, [sessionId, maxPlayersPerTeam]);
        return res.rows[0];
    } catch (err) {
        console.error('Error getting available container', err);
        throw err;
    }
}

async function createUser(data) {
    const id = generateId();

    // Normalize nickname to lowercase for consistency
    const normalizedNickName = data.nickName.toLowerCase();

    // Check for duplicate nickname within the same session
    // Get the session_id from the container
    const containerRes = await query(
        'SELECT "session_id" FROM "playerContainer" WHERE "playerContainer_id" = $1',
        [data.playerContainer_id]
    );

    if (containerRes.rows.length > 0) {
        const sessionId = containerRes.rows[0].session_id;

        // Check if nickname already exists in this session
        const duplicateCheck = await query(`
            SELECT u."user_id" FROM "user" u
            JOIN "playerContainer" pc ON u."playerContainer_id" = pc."playerContainer_id"
            WHERE LOWER(u."nickName") = $1 AND pc."session_id" = $2
        `, [normalizedNickName, sessionId]);

        if (duplicateCheck.rows.length > 0) {
            throw new Error('Display name already taken in this session');
        }
    }

    const queryText = `
      INSERT INTO "user" ("user_id", "nickName", "playerContainer_id")
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [id, normalizedNickName, data.playerContainer_id];

    try {
        const res = await query(queryText, values);
        return res.rows[0];
    } catch (err) {
        console.error('Error creating user', err);
        throw err;
    }
}


async function incrementContainerUserCount(containerId) {
    const queryText = `
      UPDATE "playerContainer" 
      SET "userConnected_count" = "userConnected_count" + 1 
      WHERE "playerContainer_id" = $1
      RETURNING *
    `;
    try {
        const res = await query(queryText, [containerId]);
        return res.rows[0];
    } catch (err) {
        console.error('Error incrementing container user count', err);
        throw err;
    }
}

async function getActiveSessionsForJoin() {
    // Get sessions that players can join (pending or active)
    const queryText = `
      SELECT s.*, 
        (SELECT COUNT(*) FROM "playerContainer" pc WHERE pc."session_id" = s."id") as team_count,
        (SELECT COALESCE(SUM("userConnected_count"), 0) FROM "playerContainer" pc WHERE pc."session_id" = s."id") as current_players
      FROM "session" s
      WHERE "session_status" IN ('pending', 'active')
      ORDER BY "createdAt" DESC
    `;
    try {
        const res = await query(queryText);
        return res.rows;
    } catch (err) {
        console.error('Error getting active sessions for join', err);
        throw err;
    }
}

async function getSessionPlayerCount(sessionId) {
    // Count total players (users) in a session by summing userConnected_count across all containers
    const queryText = `
      SELECT COALESCE(SUM("userConnected_count"), 0) as total_players
      FROM "playerContainer"
      WHERE "session_id" = $1
    `;
    try {
        const res = await query(queryText, [sessionId]);
        return parseInt(res.rows[0].total_players, 10) || 0;
    } catch (err) {
        console.error('Error getting session player count', err);
        throw err;
    }
}

module.exports = {
    query,
    createSession,
    getSession,
    getAllSessions,
    updateSessionStatus,
    getPendingSession,
    createPlayerContainer,
    updateContainerStatus,
    logBreach,
    logHint,
    getLeaderboard,
    getRecentEvents,
    getAdminByNickname,
    deleteAllSessions,
    terminateActiveSessions,
    getSessionByCode,
    getAvailableContainer,
    createUser,
    incrementContainerUserCount,
    getActiveSessionsForJoin,
    getSessionPlayerCount
};

