# API Documentation - Session & Player Management

## Overview
The API now supports session-based game management with players, breach logging, and hint tracking.

## Database Schema

### Sessions Table
- `id`: Primary key
- `session_code`: Unique 6-character code for joining (e.g., "DCC0F9")
- `admin_id`: ID of the admin who created the session
- `max_players`: Maximum number of players allowed
- `time_limit`: Time limit in seconds
- `selected_levels`: JSON array of selected victim levels
- `status`: 'lobby', 'active', or 'finished'
- `created_at`, `started_at`, `ended_at`: Timestamps
- `updated_at`: Last modification time

### Players Table
- `id`: Primary key
- `session_id`: Foreign key to sessions
- `username`: Player's username (unique per session)
- `joined_at`: Timestamp when player joined

### Breaches Table
- `id`: Primary key
- `session_id`: Foreign key to sessions
- `player_id`: Foreign key to players
- `container_id`: Docker container ID
- `username`: SSH username used for breach
- `remote_ip`: IP address of the attacker
- `level`: Which victim level was breached
- `timestamp`: Time of the breach event
- `logged_at`: Time the event was recorded

### Hint Logs Table
- Similar structure to breaches, tracks when players use hints

---

## API Endpoints

### Session Management

#### Create Session
```
POST /api/sessions
Content-Type: application/json

{
  "max_players": 4,
  "time_limit": 600,
  "selected_levels": ["level1", "level2"],
  "admin_id": "admin123"
}

Response:
{
  "success": true,
  "message": "Session created successfully",
  "session": {
    "id": 1,
    "session_code": "DCC0F9",
    "admin_id": "admin123",
    "max_players": 4,
    "time_limit": 600,
    "selected_levels": ["level1", "level2"],
    "status": "lobby",
    "created_at": "2026-01-09T14:03:37.344Z",
    "started_at": null,
    "ended_at": null,
    "updated_at": "2026-01-09T14:03:37.344Z"
  }
}
```

#### Get Session by Code
```
GET /api/sessions/:sessionCode

Response:
{
  "success": true,
  "session": { ... }
}
```

#### Get All Sessions
```
GET /api/sessions?admin_id=admin123

Response:
{
  "success": true,
  "count": 5,
  "sessions": [ ... ]
}
```

#### Update Session Status
```
PATCH /api/sessions/:sessionId/status
Content-Type: application/json

{
  "status": "active"  // or "finished"
}

Response:
{
  "success": true,
  "message": "Session status updated to active",
  "session": { ... }
}
```

#### Delete Session
```
DELETE /api/sessions/:sessionId

Response:
{
  "success": true,
  "message": "Session deleted",
  "session": { ... }
}
```

---

### Player Management

#### Join Session
```
POST /api/sessions/:sessionCode/join
Content-Type: application/json

{
  "username": "player1"
}

Response:
{
  "success": true,
  "message": "Successfully joined session",
  "player": {
    "id": 1,
    "session_id": 1,
    "username": "player1",
    "joined_at": "2026-01-09T14:03:43.390Z"
  }
}
```

Errors:
- 404: Session not found
- 400: Session is full or session not in lobby state
- 400: Username already taken in this session

#### Get Session Players
```
GET /api/sessions/:sessionId/players

Response:
{
  "success": true,
  "count": 2,
  "players": [
    {
      "id": 1,
      "username": "player1",
      "joined_at": "2026-01-09T14:03:43.390Z"
    },
    {
      "id": 2,
      "username": "player2",
      "joined_at": "2026-01-09T14:04:00.000Z"
    }
  ]
}
```

#### Remove Player
```
DELETE /api/players/:playerId

Response:
{
  "success": true,
  "message": "Player removed from session",
  "player": { ... }
}
```

---

### Event Logging

#### Log Breach
```
POST /api/logs/breach
Content-Type: application/json

{
  "session_id": 1,
  "player_id": 1,
  "container_id": "abc123def456",
  "username": "player1",
  "remote_ip": "192.168.1.50",
  "level": "level1",
  "timestamp": "2026-01-09T14:04:00Z"
}

Response:
{
  "success": true,
  "message": "Breach logged successfully"
}
```

#### Log Hint Access
```
POST /api/logs/hint-accessed
Content-Type: application/json

{
  "session_id": 1,
  "player_id": 1,
  "container_id": "abc123def456",
  "username": "player1",
  "level": "level1",
  "timestamp": "2026-01-09T14:04:05Z"
}

Response:
{
  "success": true,
  "message": "Hint access logged successfully"
}
```

---

## Game Flow Example

1. **Admin creates a session**
   ```
   POST /api/sessions
   max_players: 4, time_limit: 600, selected_levels: ["level1"], admin_id: "admin1"
   → Returns session_code: "DCC0F9"
   ```

2. **Players join the session**
   ```
   POST /api/sessions/DCC0F9/join
   username: "player1" → player_id: 1
   
   POST /api/sessions/DCC0F9/join
   username: "player2" → player_id: 2
   ```

3. **Admin checks players and starts game**
   ```
   GET /api/sessions/1/players
   → Returns count of players
   
   PATCH /api/sessions/1/status
   status: "active" → Game starts, containers spun up
   ```

4. **Players breach victims**
   ```
   POST /api/logs/breach
   session_id: 1, player_id: 1, level: "level1"
   → Breach is recorded with timestamp
   ```

5. **Admin ends game**
   ```
   PATCH /api/sessions/1/status
   status: "finished" → Game ends, results finalized
   ```

---

## Notes

- Session codes are automatically generated as 6-character hex strings
- Players can only join sessions in "lobby" state
- Username must be unique within each session
- All timestamps are UTC
- Breach and hint logs are optional (can be logged after game ends)
- Database is fully persistent - sessions survive server restarts
