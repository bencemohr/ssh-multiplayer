-- Find all sessions with their player count
SELECT s.id, s."sessionCode", s."maxPlayersPerTeam", s.session_status,
       (SELECT COUNT(*) FROM "playerContainer" pc WHERE pc."session_id" = s.id) as container_count
FROM "session" s
ORDER BY s."createdAt" DESC
LIMIT 5;

-- Check session with code 907959
SELECT id, "sessionCode" FROM "session" WHERE "sessionCode" = 907959;

-- Check what session has containers with users
SELECT DISTINCT pc."session_id", s."sessionCode", 
       (SELECT COUNT(*) FROM "user" u JOIN "playerContainer" pc2 ON u."playerContainer_id" = pc2."playerContainer_id" WHERE pc2."session_id" = pc."session_id") as user_count
FROM "playerContainer" pc
JOIN "session" s ON s.id = pc."session_id";
