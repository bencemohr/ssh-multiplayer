-- Dummy data.
-- Docker runs /docker-entrypoint-initdb.d/*.sql in filename order.
-- This file may execute before schema_creation.sql, so we explicitly run it first.

\ir /docker-entrypoint-initdb.d/schema_creation.sql

DO $$
BEGIN
    INSERT INTO "session" (
        "id",
        "sessionCode",
        "durationSecond",
        "maxPlayers",
        "session_status",
        "selectedLevels",
        "totalFlag_count",
        "maxPlayersPerTeam",
        "createdAt",
        "destroyedAt"
    ) VALUES
        (1, 100001, 1800, 6, 'active',   '["level1","level2"]',          6, 3, NOW(), NULL),
        (2, 100002, 3600, 8, 'completed','["level1","level2","level3"]',10, 4, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;

    INSERT INTO "level" ("level_id", "session_id", "service_name", "level_completion_point") VALUES
        (1, 1, 'mits-s1-level1', 100),
        (2, 1, 'mits-s1-level2', 150),
        (3, 2, 'mits-s2-level1', 100),
        (4, 2, 'mits-s2-level2', 150),
        (5, 2, 'mits-s2-level3', 200)
    ON CONFLICT DO NOTHING;

    INSERT INTO "playerContainer" (
        "playerContainer_id",
        "containerCode",
        "container_url",
        "userConnected_count",
        "isFinishedTheGame",
        "hintUsed",
        "session_id",
        "canNewUserLogin",
        "totalScore",
        "containerStatus"
    ) VALUES
        (11, 50011, 'http://localhost:11011', 2, FALSE, 0, 1, TRUE, 120, 'healthy'),
        (12, 50012, 'http://localhost:11012', 1, FALSE, 1, 1, TRUE,  80, 'started'),
        (21, 50021, 'http://localhost:12021', 3, TRUE,  2, 2, FALSE, 420, 'stopped')
    ON CONFLICT DO NOTHING;

    INSERT INTO "user" ("user_id", "nickName", "playerContainer_id") VALUES
        (101, 'alice', 11),
        (102, 'bob',   11),
        (103, 'carol', 12),
        (201, 'dave',  21),
        (202, 'erin',  21)
    ON CONFLICT DO NOTHING;

    INSERT INTO "admin" ("admin_id", "hashedPassword", "nickName") VALUES
        (9001, '$2b$10$dummyhashdummyhashdummyhashdummyhashdummyhashdummyhash', 'admin')
    ON CONFLICT DO NOTHING;

    INSERT INTO "container_logs" (
        "container_logs_id",
        "event_type",
        "timestamp",
        "playerContainer_id",
        "metaData",
        "point"
    ) VALUES
        (1001, 'hint_requested',      NOW() - INTERVAL '20 minutes', 11, '{"level":"level1","hintId":1}'::jsonb, 0),
        (1002, 'foundFlag_accepted',  NOW() - INTERVAL '15 minutes', 11, '{"level":"level1","flag":"FLAG{demo_1}"}'::jsonb, 50),
        (1003, 'level_completed',     NOW() - INTERVAL '10 minutes', 11, '{"level":"level1"}'::jsonb, 100),

        (1011, 'foundFlag_declined',  NOW() - INTERVAL '12 minutes', 12, '{"level":"level1","flag":"FLAG{wrong}"}'::jsonb, 0),
        (1012, 'hint_requested',      NOW() - INTERVAL '8 minutes',  12, '{"level":"level1","hintId":2}'::jsonb, 0),

        (2001, 'foundFlag_accepted',  NOW() - INTERVAL '36 hours',   21, '{"level":"level3","flag":"FLAG{demo_2}"}'::jsonb, 200),
        (2002, 'level_completed',     NOW() - INTERVAL '35 hours',   21, '{"level":"level3"}'::jsonb, 200)
    ON CONFLICT DO NOTHING;
END $$;
