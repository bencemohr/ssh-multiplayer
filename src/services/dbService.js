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
    console.log('executed query', { text, duration, rows: res.rowCount });
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
        'creating'
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
        const session = await getPendingSession(); // Helper for 'active' too? Pending/Active
        // Actually we need 'active' for leaderboard usually.
        // Let's assume passed sessionId for now, or fetch active.
    }

    // Join with session? No, just filter by session_id in playerContainer
    const queryText = `
      SELECT "playerContainer_id", "containerCode", "totalScore", "containerStatus", "userConnected_count" as participants,
             (SELECT COUNT(*) FROM "container_logs" WHERE "playerContainer_id" = pc."playerContainer_id" AND "event_type" = 'level_completed') as levels_completed
      FROM "playerContainer" pc
      WHERE "session_id" = $1
      ORDER BY "totalScore" DESC
    `;
    const res = await query(queryText, [sessionId]);
    return res.rows;
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
    getAdminByNickname
};
