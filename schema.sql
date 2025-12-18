-- Create containers table
CREATE TABLE IF NOT EXISTS containers (
  id SERIAL PRIMARY KEY,
  docker_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  image VARCHAR(255),
  status VARCHAR(50) DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on docker_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_docker_id ON containers(docker_id);
