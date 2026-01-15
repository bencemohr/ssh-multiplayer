const { Pool } = require('pg');

// Optional: central place for larger SQL (keeps this file mostly "original").
// Only used for the extra functions we added for scoring/levels.
const Q = require('./dbQueries');

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

// --- Levels (required for level scoring) ---

const DEFAULT_LEVEL_POINTS = {
    level1: 100,
    level2: 150,
    level3: 200,
};

function getAllowedLevelKeys() {
    const fromEnv = String(process.env.ALLOWED_LEVEL_KEYS || '').trim();
    if (!fromEnv) return new Set(Object.keys(DEFAULT_LEVEL_POINTS));

    const keys = new Set();
    for (const part of fromEnv.split(',')) {
        const key = String(part).trim().toLowerCase();
        if (key) keys.add(key);
    }
    return keys.size > 0 ? keys : new Set(Object.keys(DEFAULT_LEVEL_POINTS));
}

function coerceSelectedLevelsToArray(selectedLevels) {
    if (Array.isArray(selectedLevels)) return selectedLevels;
    if (selectedLevels === undefined || selectedLevels === null) return [];

    const raw = String(selectedLevels).trim();
    if (!raw) return [];

    if (raw.startsWith('[')) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        } catch {
            // ignore
        }
    }

    return raw
        .split(',')
        .map(s => String(s).trim())
        .filter(Boolean);
}

function parseSelectedLevelKeys(selectedLevels) {
    const allowed = getAllowedLevelKeys();
    const raw = coerceSelectedLevelsToArray(selectedLevels);
    const result = [];
    const seen = new Set();

    for (const item of raw) {
        const key = String(item).trim().toLowerCase();
        if (!key) continue;
        if (!allowed.has(key)) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(key);
    }

    if (result.length === 0) {
        const allowedList = Array.from(allowed).sort().join(', ');
        const err = new Error(`selectedLevels must include at least one valid level (${allowedList})`);
        err.statusCode = 400;
        err.code = 'VALIDATION_ERROR';
        throw err;
    }

    return result;
}

async function ensureLevelsForSession(sessionId, sessionCode, selectedLevelKeys) {
    for (const key of selectedLevelKeys) {
        const levelId = generateId();
        const serviceName = `mits-s${sessionCode}-${key}`;
        const points = DEFAULT_LEVEL_POINTS[key] ?? 0;

        // Uses the unique constraint on level.service_name to avoid duplicates.
        await query(Q.INSERT_LEVEL_FOR_SESSION, [levelId, sessionId, serviceName, points]);
    }
}

// --- Scoring (JS-owned recompute from logs) ---

async function recomputePlayerContainerScore(playerContainerId) {
    const rawPenalty = Number.parseInt(String(process.env.HINT_PENALTY || '5'), 10);
    const hintPenalty = Number.isNaN(rawPenalty) ? 5 : rawPenalty;

    const res = await query(Q.RECOMPUTE_PLAYER_CONTAINER_SCORE, [playerContainerId, hintPenalty]);
    return res.rows[0] || null;
}

// --- Session Management ---

async function createSession(data) {
    const id = generateId();

    // Avoid collisions (important because level.service_name is globally UNIQUE and includes sessionCode).
    let sessionCode;
    for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = Math.floor(100000 + Math.random() * 900000);
        const exists = await query(Q.SESSION_CODE_EXISTS, [candidate]);
        if (exists.rowCount === 0) {
            sessionCode = candidate;
            break;
        }
    }

    if (!sessionCode) {
        throw new Error('Failed to generate a unique session code. Please retry.');
    }

    // Default to allowed levels if not provided by client.
    const selectedLevelKeys = parseSelectedLevelKeys(
        data.selectedLevels === undefined || data.selectedLevels === null
            ? Array.from(getAllowedLevelKeys())
            : data.selectedLevels
    );

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
        selectedLevelKeys.join(','),
        data.totalFlag_count || 10,
        data.maxPlayersPerTeam || 1
    ];

    try {
        const res = await query(queryText, values);
        const session = res.rows[0];

        // Create rows in the level table for this session (used for level score calculation).
        await ensureLevelsForSession(session.id, session.sessionCode, selectedLevelKeys);

        return session;
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

async function findContainerByCode(containerCode) {
    if (containerCode === undefined || containerCode === null) return null;
    const normalized = String(containerCode).trim();
    if (!normalized) return null;

    const res = await query('SELECT * FROM "playerContainer" WHERE "containerCode" = $1 LIMIT 1', [normalized]);
    return res.rows[0] || null;
}

async function findContainerByUsername(username) {
    if (!username) return null;
    const normalized = String(username).trim().toLowerCase();
    if (!normalized) return null;

    const res = await query(
        `
          SELECT pc.*
          FROM "user" u
          JOIN "playerContainer" pc ON pc."playerContainer_id" = u."playerContainer_id"
          WHERE LOWER(u."nickName") = $1
          LIMIT 1
        `,
        [normalized]
    );
    return res.rows[0] || null;
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

        await recomputePlayerContainerScore(data.playerContainer_id);

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

        await recomputePlayerContainerScore(data.playerContainer_id);

        return res.rows[0];
    } catch (err) {
        console.error('Error logging hint', err);
        throw err;
    }
}

async function logEvent(data) {
    const id = generateId();

    const queryText = `
      INSERT INTO "container_logs" (
        "container_logs_id", "event_type", "playerContainer_id", "metaData", "point"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
        id,
        data.event_type,
        data.playerContainer_id,
        data.metaData || {},
        data.point ?? null,
    ];

    const res = await query(queryText, values);
    await recomputePlayerContainerScore(data.playerContainer_id);
    return res.rows[0];
}

async function getLevelCompletionPoint(sessionId, levelKey) {
    if (!sessionId || !levelKey) return 0;
    const normalized = String(levelKey).trim();
    if (!normalized) return 0;

    const res = await query(Q.GET_LEVEL_COMPLETION_POINT, [sessionId, normalized]);
    const row = res.rows[0];
    if (!row) return 0;
    return Number.parseInt(String(row.level_completion_point), 10) || 0;
}

async function getPointDistribution(sessionId, hintPenaltyPerUse) {
    const fromQuery = Number.parseInt(String(hintPenaltyPerUse), 10);
    const fromEnv = Number.parseInt(String(process.env.HINT_PENALTY || '5'), 10);
    const hintPenalty = !Number.isNaN(fromQuery)
        ? fromQuery
        : (Number.isNaN(fromEnv) ? 5 : fromEnv);

    const res = await query(Q.POINT_DISTRIBUTION_FOR_SESSION, [sessionId, hintPenalty]);
    return res.rows;
}

async function getAdminByNickname(nickname) {
    const normalized = nickname !== undefined && nickname !== null ? String(nickname).trim() : '';
    if (!normalized) return null;

    // Deterministic: seed data may create multiple rows with the same nickName.
    // Prefer the lowest admin_id (our real seeded admin is admin_id=1).
    const res = await query(
        'SELECT * FROM "admin" WHERE LOWER("nickName") = LOWER($1) ORDER BY "admin_id" ASC LIMIT 1',
        [normalized]
    );
    return res.rows[0] || null;
}

async function getLeaderboard(sessionId) {
    // If sessionId is null, get for the active session or return empty
    if (!sessionId) {
        const session = await getPendingSession();
        if (session) sessionId = session.id;
    }

    // Get session to determine mode (FFA vs Teams)
    const sessionRes = await query('SELECT "maxPlayersPerTeam" FROM "session" WHERE "id" = $1', [sessionId]);
    const row = sessionRes.rows[0];
    const maxPlayersPerTeam = row
        ? parseInt(row.maxPlayersPerTeam || row.maxplayersperteam || 1, 10)
        : 1;
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
            SELECT
                cl."container_logs_id",
                cl."event_type",
                cl."point",
                cl."timestamp" as "createdAt",
                cl."metaData",
                pc."containerCode"
      FROM "container_logs" cl
      JOIN "playerContainer" pc ON cl."playerContainer_id" = pc."playerContainer_id"
      WHERE pc."session_id" = $1
            ORDER BY cl."timestamp" DESC
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
    ensureLevelsForSession,
    getSession,
    getAllSessions,
    updateSessionStatus,
    getPendingSession,
    createPlayerContainer,
    updateContainerStatus,
    findContainerByCode,
    findContainerByUsername,
    logBreach,
    logHint,
    logEvent,
    getLevelCompletionPoint,
    getLeaderboard,
    getPointDistribution,
    getRecentEvents,
    getAdminByNickname,
    deleteAllSessions,
    terminateActiveSessions,
    getSessionByCode,
    getAvailableContainer,
    createUser,
    incrementContainerUserCount,
    getActiveSessionsForJoin,
    getSessionPlayerCount,
    recomputePlayerContainerScore
};