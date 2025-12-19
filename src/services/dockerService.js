const docker = require('../db/docker');

// Track port mappings: { containerId: hostPort }
const containerPorts = {};
let nextPort = 4001;

// Get next available port
function getNextPort() {
  return nextPort++;
}

// Extract gotty random URL from container logs
async function getGottyUrl(container) {
  try {
    const logs = await container.logs({ stdout: true, stderr: true });
    const logString = logs.toString();
    const match = logString.match(/http:\/\/\[::1\]:3000\/(\w+)\//);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting gotty URL:', error);
    return null;
  }
}

// Create an attacker container with gotty port mapping
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
      Labels: {
        'app': 'mits-multiplayer',
        'type': 'attacker',
        'template': 'attacker',
        'created_at': new Date().toISOString()
      },
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

    // Wait a moment for gotty to start and write logs
    await new Promise(resolve => setTimeout(resolve, 500));

    // Extract the random URL path
    const randomPath = await getGottyUrl(container);

    return {
      id: container.id,
      name: containerName,
      image: 'mits-attacker:latest',
      port: hostPort,
      random_path: randomPath,
      terminal_url: randomPath ? `http://localhost:${hostPort}/${randomPath}/` : `http://localhost:${hostPort}/`
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