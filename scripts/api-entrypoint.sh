#!/bin/sh
set -eu

PASSWORD_FILE="${ADMIN_PASSWORD_FILE:-/data/admin_password}"
ADMIN_NICKNAME="${ADMIN_NICKNAME:-admin}"

# Ensure directory exists
PASSWORD_DIR="$(dirname "$PASSWORD_FILE")"
mkdir -p "$PASSWORD_DIR"

# Generate a one-time password if none exists yet.
# Stored in a Docker volume so it's not committed to git.
if [ ! -f "$PASSWORD_FILE" ]; then
  umask 077
  node -e "process.stdout.write(require('crypto').randomBytes(18).toString('base64url'))" > "$PASSWORD_FILE"
  echo "[init] Generated admin password and stored at $PASSWORD_FILE" >&2
  echo "[init] Retrieve it with: docker compose exec api cat $PASSWORD_FILE" >&2
else
  echo "[init] Using existing admin password from $PASSWORD_FILE" >&2
fi

# Export password for seed script (do not print it)
export ADMIN_PASSWORD="$(cat "$PASSWORD_FILE")"
export ADMIN_NICKNAME="$ADMIN_NICKNAME"

# Seed/ensure admin user exists (idempotent)
node /app/seed-admin.js || true

# Start the API (dev mode uses nodemon)
exec npx nodemon --legacy-watch src/server.js
