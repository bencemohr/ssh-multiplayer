#!/bin/bash

# Extract login information
USERNAME="${SSH_USER:-$USER}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CONTAINER_ID=$(cat /etc/hostname)
REMOTE_IP=$(echo "$SSH_CLIENT" | awk '{print $1}')
API_HOST=${API_HOST:-"api"}
API_PORT=${API_PORT:-"3001"}

# IMPORTANT:
# The API can resolve players by `containerCode`, by game username, or (for victim SSH)
# by mapping the SSH client IP to the attacker container and then to the DB row.
CONTAINER_CODE=${CONTAINER_CODE:-""}
LEVEL_KEY=${LEVEL_KEY:-""}
LEVEL_POINTS=${LEVEL_POINTS:-""}

USERNAME_JSON=${USERNAME//"/\\"}
LEVEL_KEY_JSON=${LEVEL_KEY//"/\\"}

if [[ -n "${CONTAINER_CODE}" ]]; then
  CONTAINER_CODE_JSON="${CONTAINER_CODE}"
else
  CONTAINER_CODE_JSON="null"
fi

if [[ -n "${LEVEL_POINTS}" ]]; then
  LEVEL_POINTS_JSON="${LEVEL_POINTS}"
else
  LEVEL_POINTS_JSON="null"
fi

# Log the access to API (non-blocking)
{
  curl -s -X POST "http://${API_HOST}:${API_PORT}/api/logs/breach" \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"${USERNAME_JSON}\",
      \"containerCode\": ${CONTAINER_CODE_JSON},
      \"container_id\": \"${CONTAINER_ID}\",
      \"level\": \"${LEVEL_KEY_JSON}\",
      \"point\": ${LEVEL_POINTS_JSON},
      \"timestamp\": \"${TIMESTAMP}\",
      \"remote_ip\": \"${REMOTE_IP}\"
    }" > /dev/null 2>&1
} &

# Drop to bash shell
exec bash
