#!/bin/bash

# Hint system for attacker container
# Usage: hint [level]
# Examples: hint, hint level1, hint level2

API_HOST=${API_HOST:-"api"}
API_PORT=${API_PORT:-"3000"}
CONTAINER_ID=$(cat /etc/hostname)
USERNAME=${USER:-"unknown"}

# Extract level from argument or prompt user
if [ -z "$1" ]; then
  echo "=== HINTS AVAILABLE ==="
  echo "Level 1: Default SSH Credentials"
  echo "Level 2: Exposed SSH Private Key"
  echo "Level 3: SSH Key with Weak Passphrase"
  echo ""
  echo "Usage: hint <level>"
  echo "Example: hint level1"
  exit 0
fi

REQUESTED_LEVEL=$1

# Validate level
case "$REQUESTED_LEVEL" in
  level1|level2|level3)
    LEVEL=$REQUESTED_LEVEL
    ;;
  1)
    LEVEL="level1"
    ;;
  2)
    LEVEL="level2"
    ;;
  3)
    LEVEL="level3"
    ;;
  *)
    echo "Unknown level: $REQUESTED_LEVEL"
    echo "Available: level1, level2, level3 (or 1, 2, 3)"
    exit 1
    ;;
esac

# Log hint access to API (non-blocking)
{
  curl -s -X POST "http://${API_HOST}:${API_PORT}/api/logs/hint-accessed" \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"${USERNAME}\",
      \"container_id\": \"${CONTAINER_ID}\",
      \"level\": \"${LEVEL}\",
      \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
    }" > /dev/null 2>&1
} &

# Display the hint
case "$LEVEL" in
  level1)
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║            LEVEL 1 HINT                    ║"
    echo "╚════════════════════════════════════════════╝"
    echo ""
    echo "🔑 SSH Default Credentials"
    echo ""
    echo "Many systems come with default credentials."
    echo "Try common username/password combinations:"
    echo "  - root with 'password123'"
    echo "  - admin with common passwords"
    echo ""
    echo "Command: ssh root@<target> -p 22"
    echo ""
    ;;
  level2)
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║            LEVEL 2 HINT                    ║"
    echo "╚════════════════════════════════════════════╝"
    echo ""
    echo "🔐 SSH Key File Exposure"
    echo ""
    echo "SSH private keys are sometimes left with"
    echo "world-readable permissions. Look for:"
    echo "  - Files named 'id_rsa', 'id_ed25519', etc."
    echo "  - Check permissions: ls -la ~/.ssh/"
    echo "  - Look in /tmp, /var/www, home directories"
    echo ""
    echo "Once found, use with: ssh -i <key> user@<target>"
    echo ""
    ;;
  level3)
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║            LEVEL 3 HINT                    ║"
    echo "╚════════════════════════════════════════════╝"
    echo ""
    echo "🔓 SSH Key Passphrase Cracking"
    echo ""
    echo "Found a private key but it has a passphrase?"
    echo "Try common passwords or use john/hashcat:"
    echo ""
    echo "  john --wordlist=/usr/share/wordlists/rockyou.txt <keyfile>"
    echo ""
    echo "Or try obvious passphrases like:"
    echo "  - password, 123456, winter2025, etc."
    echo ""
    ;;
esac
