const docker = require('../db/docker');
const fs = require('fs');
const path = require('path');
const tar = require('tar-fs');

// Track port mappings: { containerId: hostPort }
const containerPorts = {};

let cachedNetworkName = null;

async function getDockerNetworkName() {
  if (process.env.DOCKER_NETWORK) {
    return process.env.DOCKER_NETWORK;
  }

  if (cachedNetworkName) {
    return cachedNetworkName;
  }

  try {
    // Inside a container, HOSTNAME is usually the container id.
    const selfId = process.env.HOSTNAME;
    if (!selfId) {
      cachedNetworkName = 'bridge';
      return cachedNetworkName;
    }

    const selfContainer = docker.getContainer(selfId);
    const data = await selfContainer.inspect();
    const networks = Object.keys(data?.NetworkSettings?.Networks || {});
    cachedNetworkName = networks[0] || 'bridge';
    return cachedNetworkName;
  } catch (error) {
    console.warn('Could not detect docker network; defaulting to bridge:', error.message);
    cachedNetworkName = 'bridge';
    return cachedNetworkName;
  }
}

async function imageExists(imageName) {
  try {
    await docker.getImage(imageName).inspect();
    return true;
  } catch {
    return false;
  }
}

async function buildImage({ contextDir, dockerfileRelPath, tag }) {
  const tarStream = tar.pack(contextDir, {
    ignore: (name) => {
      // Keep the build context small.
      if (name.includes(`${path.sep}.git${path.sep}`)) return true;
      if (name.includes(`${path.sep}node_modules${path.sep}`)) return true;
      if (name.includes(`${path.sep}app${path.sep}node_modules${path.sep}`)) return true;
      if (name.includes(`${path.sep}.next${path.sep}`)) return true;
      return false;
    }
  });

  const stream = await docker.buildImage(tarStream, {
    t: tag,
    dockerfile: dockerfileRelPath
  });

  await new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
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

// Resolve which attacker container initiated an SSH connection by matching the client IP
// (victims see the attacker container's network IP in SSH_CLIENT/SSH_CONNECTION).
async function getAttackerHostnameByIp(remoteIp) {
  const normalized = remoteIp !== undefined && remoteIp !== null ? String(remoteIp).trim() : '';
  if (!normalized) return null;

  const networkName = await getDockerNetworkName();

  const containers = await docker.listContainers({
    all: true,
    filters: {
      label: ['type=MITS-ATTACKER']
    }
  });

  for (const info of containers) {
    try {
      const c = docker.getContainer(info.Id);
      const inspected = await c.inspect();
      const ip = inspected?.NetworkSettings?.Networks?.[networkName]?.IPAddress
        || inspected?.NetworkSettings?.IPAddress
        || '';

      if (ip && String(ip).trim() === normalized) {
        return inspected.Id.substring(0, 12);
      }
    } catch {
      // ignore containers that disappear mid-loop
    }
  }

  return null;
}

// Create an attacker container with gotty port mapping
async function createAttacker(name) {
  try {
    const containerName = name || `attacker-${Date.now()}`;

    const networkName = await getDockerNetworkName();

    // Let Docker assign a random available port by using '0'
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
      Env: [
        'API_HOST=api',
        'API_PORT=3001'
      ],
      ExposedPorts: {
        '3000/tcp': {}
      },
      HostConfig: {
        NetworkMode: networkName,
        PortBindings: {
          '3000/tcp': [{ HostPort: '0' }]
        }
      }
    });

    await container.start();

    const data = await container.inspect();
    const ports = data.NetworkSettings.Ports['3000/tcp'];
    const hostPort = ports && ports[0] ? ports[0].HostPort : null;
    // Get internal docker IP (try default, or first network)
    const ipAddress = data.NetworkSettings.IPAddress || Object.values(data.NetworkSettings.Networks)[0]?.IPAddress;

    if (!hostPort) {
      throw new Error('Failed to get assigned port from Docker');
    }

    // Store port mapping
    containerPorts[container.id] = hostPort;

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
      status: 'running',
      ip_address: ipAddress
    };
  } catch (error) {
    throw new Error(`Docker create attacker failed: ${error.message}`);
  }
}

async function createVictim({ image, containerName, env = {}, labelLevel }) {
  const networkName = await getDockerNetworkName();

  // If container exists, just start it.
  const existing = await docker.listContainers({
    all: true,
    filters: { name: [containerName] }
  });

  if (existing.length > 0) {
    const container = docker.getContainer(existing[0].Id);
    if (existing[0].State !== 'running') {
      await container.start();
    }
    return {
      id: existing[0].Id,
      name: containerName,
      hostname: containerName,
      status: 'running'
    };
  }

  const envArray = Object.entries(env).map(([k, v]) => `${k}=${v}`);
  envArray.push(`VICTIM_NAME=${containerName}`);

  const container = await docker.createContainer({
    Image: image,
    name: containerName,
    Env: envArray,
    Labels: {
      app: 'mits-multiplayer',
      type: 'MITS-VICTIM',
      level: labelLevel || containerName
    },
    ExposedPorts: {
      '22/tcp': {}
    },
    HostConfig: {
      NetworkMode: networkName,
      // Host port is optional for gameplay (attackers can use hostname on network).
      // Leaving it mapped to 0 makes it discoverable from host for debugging.
      PortBindings: {
        '22/tcp': [{ HostPort: '0' }]
      }
    }
  });

  await container.start();

  const info = await container.inspect();
  const hostPort = info?.NetworkSettings?.Ports?.['22/tcp']?.[0]?.HostPort || null;

  return {
    id: container.id,
    name: containerName,
    hostname: containerName,
    sshHostPort: hostPort,
    status: 'running'
  };
}

async function deployVictims({ forceBuild = false } = {}) {
  const contextDir = process.cwd();
  const templatesDir = path.join(contextDir, 'templates', 'docker');

  if (!fs.existsSync(templatesDir)) {
    throw new Error(`Missing templates directory inside api container: ${templatesDir}. Ensure docker-compose mounts ./templates into /app/templates.`);
  }

  const levelJsonFiles = fs.readdirSync(templatesDir).filter((f) => /^level\d+\.json$/.test(f));
  const results = [];

  for (const file of levelJsonFiles) {
    const levelKey = file.replace(/\.json$/, ''); // level1
    const config = JSON.parse(fs.readFileSync(path.join(templatesDir, file), 'utf8'));

    const image = config.image || `mits-${levelKey}:latest`;
    const dockerfileRelPath = config.dockerfile || path.posix.join('templates', 'docker', `Dockerfile.${levelKey}`);

    const needsBuild = forceBuild || !(await imageExists(image));
    if (needsBuild) {
      await buildImage({ contextDir, dockerfileRelPath, tag: image });
    }

    // If we rebuilt the image, we must recreate the container so it picks up the new filesystem.
    if (forceBuild) {
      const existing = await docker.listContainers({
        all: true,
        filters: { name: [levelKey] }
      });

      for (const info of existing) {
        const container = docker.getContainer(info.Id);
        try {
          if (info.State !== 'exited') {
            await container.stop();
          }
        } catch {
          // ignore
        }
        try {
          await container.remove({ force: true });
        } catch (e) {
          console.warn(`Failed removing existing victim container ${levelKey}: ${e.message}`);
        }
      }
    }

    results.push(
      await createVictim({
        image,
        containerName: levelKey,
        env: config.environment || {},
        labelLevel: levelKey
      })
    );
  }

  return results;
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

// Remove containers by label
async function removeContainersByLabel(labelKey, labelValue) {
  try {
    const filters = {};
    filters['label'] = [`${labelKey}=${labelValue}`];

    const containers = await docker.listContainers({ filters, all: true });
    const removed = [];

    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);

      // Stop if running
      try {
        if (containerInfo.State !== 'exited') {
          await container.stop();
        }
      } catch (e) {
        // Ignore if already stopped or error
        console.warn(`Error stopping container ${containerInfo.Id}: ${e.message}`);
      }

      // Remove
      try {
        await container.remove({ force: true });
        removed.push({
          id: containerInfo.Id.substring(0, 12),
          name: containerInfo.Names[0] || 'unknown'
        });
      } catch (e) {
        console.error(`Error removing container ${containerInfo.Id}: ${e.message}`);
      }
    }

    return removed;
  } catch (error) {
    throw new Error(`Failed to remove containers: ${error.message}`);
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
  createVictim,
  deployVictims,
  getAttackerHostnameByIp,
  stopContainersByLabel,
  removeContainersByLabel,
  startContainersByLabel,
  containerPorts
};