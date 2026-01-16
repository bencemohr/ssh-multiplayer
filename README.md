# Project MITS - Multiplayer

The home repository for the MITS Multiplayer API

## Setup
1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Database**:
    Ensure PostgreSQL is running (via Docker).
3.  **Seed Admin User**:
    ```bash
    node seed-admin.js
    ```
    By default (Docker Compose), the admin password is generated automatically and stored in the API container volume.

    Retrieve it with:
    ```bash
    docker compose exec api cat /data/admin_password
    ```

4.  **Deep Cleanup**:
    If you need to completely wipe all containers (including dynamic player containers):
    ```bash
    npm run docker:clean
    ```

## Development
Carried out by IT2E for Maritime IT Security Research Group, NHL Stenden University of Applied Sciences. Emmen.
