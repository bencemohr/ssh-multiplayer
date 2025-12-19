BEGIN;

CREATE TEMP TABLE _json_lines(line text);
COPY _json_lines FROM PROGRAM 'cat /docker-entrypoint-initdb.d/data.json';

WITH raw AS (
    SELECT string_agg(line, E'\n') AS txt
    FROM _json_lines
), payload AS (
    SELECT txt::jsonb AS j
    FROM raw
)
INSERT INTO ctf_user (userName)
SELECT elem->>'userName'
FROM payload,
         jsonb_array_elements(payload.j) AS elem
WHERE (elem ? 'userName')
    AND nullif(elem->>'userName', '') IS NOT NULL
ON CONFLICT (userName) DO NOTHING;

COMMIT;