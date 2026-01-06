#!/bin/bash

LAN_IP=$(hostname -I | awk '{print $1}')

if [ -z "$LAN_IP" ]; then
  echo "Error: Unable to determine LAN IP address"
  exit 1
fi

# Update or append LAN_IP to .env
if grep -q "^LAN_IP=" .env; then
    sed -i "s/^LAN_IP=.*/LAN_IP=$LAN_IP/" .env
else
    echo "LAN_IP=$LAN_IP" >> .env
fi

docker compose up -d --build