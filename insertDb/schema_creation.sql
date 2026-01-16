CREATE TABLE IF NOT EXISTS "session"(
    "id" BIGINT NOT NULL PRIMARY KEY,
    "sessionCode" BIGINT NOT NULL,
    "durationSecond" BIGINT NOT NULL,
    "maxPlayers" BIGINT NOT NULL,
    "session_status" VARCHAR(255)
        CHECK ("session_status" IN ('pending', 'active', 'completed')) NOT NULL,
    "selectedLevels" TEXT NOT NULL,
    "totalFlag_count" BIGINT NOT NULL,
    "maxPlayersPerTeam" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(0)
    WITH
        TIME zone NOT NULL,
    "destroyedAt" TIMESTAMP(0)
    WITH
        TIME zone
);


CREATE TABLE IF NOT EXISTS "playerContainer"(
    "playerContainer_id" BIGINT NOT NULL PRIMARY KEY,
    "containerCode" BIGINT NOT NULL UNIQUE,
    "container_url" TEXT NOT NULL,
    "userConnected_count" BIGINT,
    "isFinishedTheGame" BOOLEAN DEFAULT FALSE,
    "hintUsed" BIGINT,
    "session_id" BIGINT NOT NULL REFERENCES "session"("id"),
    "canNewUserLogin" BOOLEAN DEFAULT TRUE,
    "totalScore" BIGINT NOT NULL,
    "containerStatus" VARCHAR(255) CHECK (
        "containerStatus" IN (
        'creating',      
        'started',      
        'healthy',       
        'unhealthy',     
        'refused',      
        'stopped',       
        'destroyed'
        )
    ) NOT NULL,
    "ip_address" TEXT
);

CREATE TABLE IF NOT EXISTS "user"(
    "user_id" BIGINT NOT NULL PRIMARY KEY,
    "nickName" TEXT NOT NULL UNIQUE,
    "playerContainer_id" BIGINT REFERENCES "playerContainer"("playerContainer_id")
);

CREATE TABLE IF NOT EXISTS "container_logs"(
    "container_logs_id" BIGINT NOT NULL PRIMARY KEY,
    "event_type" VARCHAR(255) CHECK (
        "event_type" IN (
            'foundFlag_accepted', 
            'foundFlag_declined', 
            'hint_requested', 
            'level_completed'
        )
    ) NOT NULL,
    "timestamp" TIMESTAMP(0) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playerContainer_id" BIGINT NOT NULL REFERENCES "playerContainer"("playerContainer_id"),
    "metaData" JSONB NOT NULL,
    "point" BIGINT
);

CREATE TABLE IF NOT EXISTS "admin"(
    "admin_id" BIGINT NOT NULL PRIMARY KEY,
    "hashedPassword" TEXT NOT NULL,
    "nickName" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "level"(
    "level_id" BIGINT NOT NULL PRIMARY KEY,
    "session_id" BIGINT NOT NULL REFERENCES "session"("id"),
    "service_name" TEXT NOT NULL UNIQUE,
    "level_completion_point" BIGINT NOT NULL
);