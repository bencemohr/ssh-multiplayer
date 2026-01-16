// Centralized SQL queries for dbService.

const INSERT_LEVEL_FOR_SESSION = `
  INSERT INTO "level" ("level_id", "session_id", "service_name", "level_completion_point")
  VALUES ($1, $2, $3, $4)
  ON CONFLICT ("service_name") DO NOTHING
`;

const CREATE_SESSION = `
  INSERT INTO "session" (
    "id", "sessionCode", "durationSecond", "maxPlayers",
    "session_status", "selectedLevels", "totalFlag_count",
    "maxPlayersPerTeam", "createdAt"
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
  RETURNING *
`;

const GET_SESSION_BY_ID = 'SELECT * FROM "session" WHERE id = $1';

const GET_ALL_SESSIONS = 'SELECT * FROM "session" ORDER BY "createdAt" DESC';

const SESSION_CODE_EXISTS = 'SELECT 1 FROM "session" WHERE "sessionCode" = $1 LIMIT 1';

const UPDATE_SESSION_STATUS = 'UPDATE "session" SET "session_status" = $1 WHERE id = $2 RETURNING *';

const GET_PENDING_SESSION = `
  SELECT *
  FROM "session"
  WHERE session_status = $1
  ORDER BY "createdAt" DESC
  LIMIT 1
`;

const TERMINATE_ACTIVE_SESSIONS = `
  UPDATE "session"
  SET "session_status" = 'completed'
  WHERE "session_status" IN ('pending', 'active')
`;

const CREATE_PLAYER_CONTAINER = `
  INSERT INTO "playerContainer" (
    "playerContainer_id", "containerCode", "container_url",
    "userConnected_count", "session_id", "totalScore",
    "containerStatus"
  ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *
`;

const UPDATE_CONTAINER_STATUS =
  'UPDATE "playerContainer" SET "containerStatus" = $1 WHERE "playerContainer_id" = $2 RETURNING *';

const FIND_CONTAINER_BY_CODE = 'SELECT * FROM "playerContainer" WHERE "containerCode" = $1 LIMIT 1';

const FIND_CONTAINER_BY_USERNAME = `
  SELECT pc.*
  FROM "user" u
  JOIN "playerContainer" pc ON pc."playerContainer_id" = u."playerContainer_id"
  WHERE LOWER(u."nickName") = $1
  LIMIT 1
`;

const INSERT_CONTAINER_LOG = `
  INSERT INTO "container_logs" (
    "container_logs_id", "event_type", "playerContainer_id", "metaData", "point"
  ) VALUES ($1, $2, $3, $4, $5)
  RETURNING *
`;

const GET_LEVEL_COMPLETION_POINT = `
  SELECT "level_completion_point"
  FROM "level"
  WHERE "session_id" = $1
    AND (
      "service_name" = $2
      OR "service_name" ILIKE '%' || $2 || '%'
    )
  LIMIT 1
`;

// Recompute a single container's totalScore from logs.
// Params: $1 = playerContainerId, $2 = hintPenalty
const RECOMPUTE_PLAYER_CONTAINER_SCORE = `
  UPDATE "playerContainer" pc
  SET
    "totalScore" = dist.total_score,
    "hintUsed" = dist.hint_used
  FROM (
    SELECT
      pc."playerContainer_id",
      COALESCE(flags.flag_score, 0) AS flag_score,
      COALESCE(levels.level_score, 0) AS level_score,
      COALESCE(hints.hint_used, 0) AS hint_used,
      (
        COALESCE(flags.flag_score, 0)
        + COALESCE(levels.level_score, 0)
        - (COALESCE(hints.hint_used, 0) * $2::int)
      )::BIGINT AS total_score
    FROM "playerContainer" pc
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(COALESCE(cl."point", 0)), 0)::BIGINT AS flag_score
      FROM "container_logs" cl
      WHERE cl."playerContainer_id" = pc."playerContainer_id"
        AND cl."event_type" = 'foundFlag_accepted'
    ) flags ON TRUE
    LEFT JOIN LATERAL (
      SELECT COALESCE(COUNT(*), 0)::BIGINT AS hint_used
      FROM "container_logs" cl
      WHERE cl."playerContainer_id" = pc."playerContainer_id"
        AND cl."event_type" = 'hint_requested'
    ) hints ON TRUE
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(l."level_completion_point"), 0)::BIGINT AS level_score
      FROM (
        SELECT DISTINCT NULLIF(cl."metaData"->>'levelKey', '') AS level_key
        FROM "container_logs" cl
        WHERE cl."playerContainer_id" = pc."playerContainer_id"
          AND cl."event_type" = 'level_completed'
          AND NULLIF(cl."metaData"->>'levelKey', '') IS NOT NULL
      ) dl
      JOIN "level" l
        ON l."session_id" = pc."session_id"
       AND (
            l."service_name" = dl.level_key
            OR l."service_name" ILIKE '%' || dl.level_key || '%'
       )
    ) levels ON TRUE
    WHERE pc."playerContainer_id" = $1
  ) dist
  WHERE pc."playerContainer_id" = dist."playerContainer_id"
  RETURNING pc.*
`;

// Breakdown per container for a session.
// Params: $1 = sessionId, $2 = hintPenalty
const POINT_DISTRIBUTION_FOR_SESSION = `
  WITH
    flags AS (
      SELECT cl."playerContainer_id", SUM(COALESCE(cl."point", 0)) AS flag_score
      FROM "container_logs" cl
      JOIN "playerContainer" pc ON pc."playerContainer_id" = cl."playerContainer_id"
      WHERE pc."session_id" = $1
        AND cl."event_type" = 'foundFlag_accepted'
      GROUP BY cl."playerContainer_id"
    ),
    hints AS (
      SELECT cl."playerContainer_id", COUNT(*) AS hint_used
      FROM "container_logs" cl
      JOIN "playerContainer" pc ON pc."playerContainer_id" = cl."playerContainer_id"
      WHERE pc."session_id" = $1
        AND cl."event_type" = 'hint_requested'
      GROUP BY cl."playerContainer_id"
    ),
    distinct_levels AS (
      SELECT
        cl."playerContainer_id",
        NULLIF(cl."metaData"->>'levelKey', '') AS level_key
      FROM "container_logs" cl
      JOIN "playerContainer" pc ON pc."playerContainer_id" = cl."playerContainer_id"
      WHERE pc."session_id" = $1
        AND cl."event_type" = 'level_completed'
        AND NULLIF(cl."metaData"->>'levelKey', '') IS NOT NULL
      GROUP BY cl."playerContainer_id", NULLIF(cl."metaData"->>'levelKey', '')
    ),
    level_scores AS (
      SELECT dl."playerContainer_id", SUM(l."level_completion_point") AS level_score
      FROM distinct_levels dl
      JOIN "playerContainer" pc ON pc."playerContainer_id" = dl."playerContainer_id"
      JOIN "level" l
        ON l."session_id" = pc."session_id"
       AND (
            l."service_name" = dl.level_key
            OR l."service_name" ILIKE '%' || dl.level_key || '%'
       )
      GROUP BY dl."playerContainer_id"
    )
  SELECT
    pc."playerContainer_id",
    pc."containerCode",
    COALESCE(flags.flag_score, 0) AS flag_score,
    COALESCE(level_scores.level_score, 0) AS level_score,
    COALESCE(hints.hint_used, 0) AS hint_used,
    $2::int AS hint_penalty,
    (
      COALESCE(flags.flag_score, 0)
      + COALESCE(level_scores.level_score, 0)
      - COALESCE(hints.hint_used, 0) * $2::int
    ) AS total_score
  FROM "playerContainer" pc
  LEFT JOIN flags ON flags."playerContainer_id" = pc."playerContainer_id"
  LEFT JOIN hints ON hints."playerContainer_id" = pc."playerContainer_id"
  LEFT JOIN level_scores ON level_scores."playerContainer_id" = pc."playerContainer_id"
  WHERE pc."session_id" = $1
  ORDER BY total_score DESC
`;

const GET_ADMIN_BY_NICKNAME = 'SELECT * FROM "admin" WHERE "nickName" = $1';

const GET_SESSION_MODE = 'SELECT "maxPlayersPerTeam" FROM "session" WHERE "id" = $1';

const GET_LEADERBOARD = `
  SELECT
    pc."playerContainer_id",
    pc."containerCode",
    pc."totalScore",
    pc."containerStatus",
    pc."userConnected_count" as participants,
    (
      SELECT COUNT(*)
      FROM "container_logs"
      WHERE "playerContainer_id" = pc."playerContainer_id"
        AND "event_type" = 'level_completed'
    ) as levels_completed,
    (
      SELECT STRING_AGG(u."nickName", ', ')
      FROM "user" u
      WHERE u."playerContainer_id" = pc."playerContainer_id"
    ) as player_names
  FROM "playerContainer" pc
  WHERE pc."session_id" = $1
  ORDER BY pc."totalScore" DESC
`;

const GET_RECENT_EVENTS = `
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

const DELETE_ALL_SESSIONS = 'TRUNCATE TABLE "session" CASCADE';

const GET_SESSION_BY_CODE = `
  SELECT *
  FROM "session"
  WHERE "sessionCode" = $1
    AND "session_status" IN ('pending', 'active')
`;

const GET_AVAILABLE_CONTAINER = `
  SELECT *
  FROM "playerContainer"
  WHERE "session_id" = $1
    AND "userConnected_count" < $2
    AND "containerStatus" IN ('started', 'healthy', 'creating')
  ORDER BY "userConnected_count" ASC
  LIMIT 1
`;

const GET_CONTAINER_SESSION_ID = 'SELECT "session_id" FROM "playerContainer" WHERE "playerContainer_id" = $1';

const FIND_DUPLICATE_NICKNAME_IN_SESSION = `
  SELECT u."user_id"
  FROM "user" u
  JOIN "playerContainer" pc ON u."playerContainer_id" = pc."playerContainer_id"
  WHERE LOWER(u."nickName") = $1
    AND pc."session_id" = $2
`;

const CREATE_USER = `
  INSERT INTO "user" ("user_id", "nickName", "playerContainer_id")
  VALUES ($1, $2, $3)
  RETURNING *
`;

const INCREMENT_CONTAINER_USER_COUNT = `
  UPDATE "playerContainer"
  SET "userConnected_count" = "userConnected_count" + 1
  WHERE "playerContainer_id" = $1
  RETURNING *
`;

const GET_ACTIVE_SESSIONS_FOR_JOIN = `
  SELECT s.*,
    (SELECT COUNT(*) FROM "playerContainer" pc WHERE pc."session_id" = s."id") as team_count,
    (SELECT COALESCE(SUM("userConnected_count"), 0) FROM "playerContainer" pc WHERE pc."session_id" = s."id") as current_players
  FROM "session" s
  WHERE "session_status" IN ('pending', 'active')
  ORDER BY "createdAt" DESC
`;

const GET_SESSION_PLAYER_COUNT = `
  SELECT COALESCE(SUM("userConnected_count"), 0) as total_players
  FROM "playerContainer"
  WHERE "session_id" = $1
`;

module.exports = {
  INSERT_LEVEL_FOR_SESSION,
  CREATE_SESSION,
  GET_SESSION_BY_ID,
  GET_ALL_SESSIONS,
  SESSION_CODE_EXISTS,
  UPDATE_SESSION_STATUS,
  GET_PENDING_SESSION,
  TERMINATE_ACTIVE_SESSIONS,
  CREATE_PLAYER_CONTAINER,
  UPDATE_CONTAINER_STATUS,
  FIND_CONTAINER_BY_CODE,
  FIND_CONTAINER_BY_USERNAME,
  INSERT_CONTAINER_LOG,
  GET_LEVEL_COMPLETION_POINT,
  RECOMPUTE_PLAYER_CONTAINER_SCORE,
  POINT_DISTRIBUTION_FOR_SESSION,
  GET_ADMIN_BY_NICKNAME,
  GET_SESSION_MODE,
  GET_LEADERBOARD,
  GET_RECENT_EVENTS,
  DELETE_ALL_SESSIONS,
  GET_SESSION_BY_CODE,
  GET_AVAILABLE_CONTAINER,
  GET_CONTAINER_SESSION_ID,
  FIND_DUPLICATE_NICKNAME_IN_SESSION,
  CREATE_USER,
  INCREMENT_CONTAINER_USER_COUNT,
  GET_ACTIVE_SESSIONS_FOR_JOIN,
  GET_SESSION_PLAYER_COUNT,
};
