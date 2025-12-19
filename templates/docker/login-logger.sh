#!/bin/bash

# Extract login information
USERNAME=${SSH_USER:-$USER}
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
CONTAINER_ID=$(cat /etc/hostname)
REMOTE_IP=$(echo $SSH_CLIENT | awk '{print $1}')
API_HOST=${API_HOST:-"host.docker.internal"}
API_PORT=${API_PORT:-"3000"}

# Log the access to API (non-blocking)
{
  curl -s -X POST "http://${API_HOST}:${API_PORT}/api/logs/access" \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"${USERNAME}\",
      \"container_id\": \"${CONTAINER_ID}\",
      \"timestamp\": \"${TIMESTAMP}\",
      \"remote_ip\": \"${REMOTE_IP}\"
    }" > /dev/null 2>&1
} &

# Drop to bash shell
exec bash
