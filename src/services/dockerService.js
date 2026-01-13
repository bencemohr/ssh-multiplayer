const docker = require('../db/docker');

// Track port mappings: { containerId: hostPort }
const containerPorts = {};
let nextPort = 4001;

// Get next available port
function getNextPort() {
  return nextPort++;
}

// Get container hostname (used as gotty path prefix)
async function getContainerHostname(container) {
  try {
    const data = await container.inspect();
    // Use the last 12 chars of container ID (short ID = hostname)
    return data.Id.substring(0, 12);
  } catch (error) {
    console.error('Error getting container hostname:', error);
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
        'type': 'MITS-ATTACKER',
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

    // Start the container temporarily to initialize it
    await container.start();

    // Wait a moment for gotty to start and container to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get container hostname (short container ID)
    const hostname = await getContainerHostname(container);

    // Stop the container - admin will start it when needed
    // await container.stop();

    return {
      id: container.id,
      name: containerName,
      image: 'mits-attacker:latest',
      port: hostPort,
      hostname: hostname,
      terminal_url: hostname ? `http://localhost:${hostPort}/${hostname}/` : `http://localhost:${hostPort}/`,
      status: 'running'
    };
  } catch (error) {
    throw new Error(`Docker create attacker failed: ${error.message}`);
  }
}

// Stop containers by label
async function stopContainersByLabel(labelKey, labelValue) {
  try {
    const filters = {};
    filters['label'] = [`${labelKey}=${labelValue}`];

    const containers = await docker.listContainers({ filters, all: true });
    const stopped = [];

    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      if (containerInfo.State !== 'exited') {
        await container.stop();
        stopped.push({
          id: containerInfo.Id.substring(0, 12),
          name: containerInfo.Names[0] || 'unknown'
        });
      }
    }

    return stopped;
  } catch (error) {
    throw new Error(`Failed to stop containers: ${error.message}`);
  }
}

// Start containers by label
async function startContainersByLabel(labelKey, labelValue) {
  try {
    const filters = {};
    filters['label'] = [`${labelKey}=${labelValue}`];

    const containers = await docker.listContainers({ filters, all: true });
    const started = [];

    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      if (containerInfo.State === 'exited') {
        await container.start();
        started.push({
          id: containerInfo.Id.substring(0, 12),
          name: containerInfo.Names[0] || 'unknown'
        });
      }
    }

    return started;
  } catch (error) {
    throw new Error(`Failed to start containers: ${error.message}`);
  }
}

module.exports = {
  createAttacker,
  stopContainersByLabel,
  startContainersByLabel,
  containerPorts
};