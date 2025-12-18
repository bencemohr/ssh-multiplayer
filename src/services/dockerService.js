const docker = require('../db/docker');

// Track port mappings: { containerId: hostPort }
const containerPorts = {};
let nextPort = 4001;

// Get next available port
function getNextPort() {
  return nextPort++;
}

// Create an attacker container with weTTY port mapping
async function createAttacker(name) {
  try {
    const containerName = name || `attacker-${Date.now()}`;
    const hostPort = getNextPort();

    const container = await docker.createContainer({
      Image: 'mits-attacker:latest',
      name: containerName,
      Tty: true,
      OpenStdin: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      ExposedPorts: {
        '3000/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '3000/tcp': [{ HostPort: hostPort.toString() }]
        }
      }
    });

    // Store port mapping
    containerPorts[container.id] = hostPort;

    // Start the container
    await container.start();

    return {
      id: container.id,
      name: containerName,
      image: 'mits-attacker:latest',
      port: hostPort,
      terminal_url: `http://localhost:${hostPort}`
    };
  } catch (error) {
    throw new Error(`Docker create attacker failed: ${error.message}`);
  }
}

// Get terminal URL for a container
function getTerminalUrl(containerId) {
  const port = containerPorts[containerId];
  if (!port) {
    throw new Error(`Container ${containerId} not found or no port mapping`);
  }
  return {
    terminal_url: `http://localhost:${port}`
  };
}

module.exports = {
  createAttacker,
  getTerminalUrl,
  containerPorts
};