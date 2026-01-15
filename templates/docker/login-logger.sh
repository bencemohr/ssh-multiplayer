#!/bin/bash

# Extract login information
USERNAME="${SSH_USER:-$USER}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CONTAINER_ID=$(cat /etc/hostname)
REMOTE_IP=$(echo "$SSH_CLIENT" | awk '{print $1}')
API_HOST=${API_HOST:-"api"}
API_PORT=${API_PORT:-"3001"}

# IMPORTANT:
# The API resolves players by `containerCode` (DB field) or by game username.
# Victim containers typically only know their Docker hostname, so you should pass
# CONTAINER_CODE as an environment variable when starting the victim container.
CONTAINER_CODE=${CONTAINER_CODE:-""}
LEVEL_KEY=${LEVEL_KEY:-""}
LEVEL_POINTS=${LEVEL_POINTS:-""}

# Log the access to API (non-blocking)
{
  curl -s -X POST "http://${API_HOST}:${API_PORT}/api/logs/breach" \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"${USERNAME}\",
      \"containerCode\": ${CONTAINER_CODE:-null},
      \"container_id\": \"${CONTAINER_ID}\",
      \"level\": \"${LEVEL_KEY}\",
      \"point\": ${LEVEL_POINTS:-null},
      \"timestamp\": \"${TIMESTAMP}\",
      \"remote_ip\": \"${REMOTE_IP}\"
    }" > /dev/null 2>&1
} &

# Drop to bash shell
exec bash
