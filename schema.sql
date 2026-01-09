-- ========================================
-- Sessions Table
-- ========================================
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_code VARCHAR(10) NOT NULL UNIQUE,
  admin_id VARCHAR(255),
  max_players INTEGER NOT NULL DEFAULT 5,
  time_limit INTEGER NOT NULL DEFAULT 600,
  selected_levels JSONB,
  mode VARCHAR(50) DEFAULT 'single' CHECK (mode IN ('single', 'multiplayer')),
  team_size INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'finished')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_code ON sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_session_admin ON sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_session_status ON sessions(status);

-- ========================================
-- Players Table
-- ========================================
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, username)
);

CREATE INDEX IF NOT EXISTS idx_player_session ON players(session_id);

-- ========================================
-- Teams Table
-- ========================================
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  team_number INTEGER NOT NULL,
  container_id VARCHAR(255),
  container_port INTEGER,
  container_hostname VARCHAR(255),
  container_url TEXT,
  status VARCHAR(50) DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, team_number)
);

CREATE INDEX IF NOT EXISTS idx_team_session ON teams(session_id);
CREATE INDEX IF NOT EXISTS idx_team_container ON teams(container_id);

-- ========================================
-- Team Members Table
-- ========================================
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_team_member_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_member_player ON team_members(player_id);

-- ========================================
-- Breaches Table (Login Events)
-- ========================================
CREATE TABLE IF NOT EXISTS breaches (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  container_id VARCHAR(255),
  username VARCHAR(255),
  remote_ip VARCHAR(45),
  level VARCHAR(50),
  timestamp TIMESTAMP,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_breach_session ON breaches(session_id);
CREATE INDEX IF NOT EXISTS idx_breach_player ON breaches(player_id);
CREATE INDEX IF NOT EXISTS idx_breach_container ON breaches(container_id);

-- ========================================
-- Hint Logs Table
-- ========================================
CREATE TABLE IF NOT EXISTS hint_logs (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
  container_id VARCHAR(255),
  username VARCHAR(255),
  level VARCHAR(50),
  timestamp TIMESTAMP,
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hint_session ON hint_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_hint_player ON hint_logs(player_id);

-- ========================================
-- Containers Table (for tracking)
-- ========================================
CREATE TABLE IF NOT EXISTS containers (
  id SERIAL PRIMARY KEY,
  docker_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  image VARCHAR(255),
  status VARCHAR(50) DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_docker_id ON containers(docker_id);
