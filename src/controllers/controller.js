const dockerService = require('../services/dockerService');

// POST /api/createattacker
// Create a new attacker container
// Body: { "name": "attacker-custom" } (optional)
// Returns: { id, name, terminal_url, status }
async function createAttacker(req, res) {
  try {
    const { name } = req.body;
    const container = await dockerService.createAttacker(name);

    res.status(201).json({
      success: true,
      message: 'Attacker container created',
      container,
    });
  } catch (error) {
    console.error('Error creating attacker:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/logs/breach
// Log a breach/login event from container
async function breach(req, res) {
  try {
    const { remote_ip, username, container_id, timestamp } = req.body;
    
    // TODO: Save to database
    console.log('[BREACH LOGGED]', {
      container_id,
      username,
      remote_ip,
      timestamp,
      logged_at: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Breach logged successfully'
    });
  } catch (error) {
    console.error('Error logging breach:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/logs/hint-accessed
// Log when a player accesses a hint
async function hintAccessed(req, res) {
  try {
    const { container_id, username, level, timestamp } = req.body;
    
    // TODO: Save to database
    console.log('[HINT ACCESSED]', {
      container_id,
      username,
      level,
      timestamp,
      logged_at: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Hint access logged successfully'
    });
  } catch (error) {
    console.error('Error logging hint access:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/containers/full-stop
// Stop all attacker and victim containers
async function fullStop(req, res) {
  try {
    const stoppedAttackers = await dockerService.stopContainersByLabel('type', 'MITS-ATTACKER');
    const stoppedVictims = await dockerService.stopContainersByLabel('type', 'MITS-VICTIM');

    res.json({
      success: true,
      message: 'All containers stopped',
      stopped_attackers: stoppedAttackers.length,
      stopped_victims: stoppedVictims.length,
      containers: [...stoppedAttackers, ...stoppedVictims]
    });
  } catch (error) {
    console.error('Error stopping containers:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/containers/full-start
// Start all attacker and victim containers
async function fullStart(req, res) {
  try {
    const startedAttackers = await dockerService.startContainersByLabel('type', 'MITS-ATTACKER');
    const startedVictims = await dockerService.startContainersByLabel('type', 'MITS-VICTIM');

    res.json({
      success: true,
      message: 'All containers started',
      started_attackers: startedAttackers.length,
      started_victims: startedVictims.length,
      containers: [...startedAttackers, ...startedVictims]
    });
  } catch (error) {
    console.error('Error starting containers:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/containers/attacker-stop
// Stop all attacker containers
async function attackerStop(req, res) {
  try {
    const stopped = await dockerService.stopContainersByLabel('type', 'MITS-ATTACKER');

    res.json({
      success: true,
      message: 'All attacker containers stopped',
      count: stopped.length,
      containers: stopped
    });
  } catch (error) {
    console.error('Error stopping attacker containers:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/containers/attacker-start
// Start all attacker containers
async function attackerStart(req, res) {
  try {
    const started = await dockerService.startContainersByLabel('type', 'MITS-ATTACKER');

    res.json({
      success: true,
      message: 'All attacker containers started',
      count: started.length,
      containers: started
    });
  } catch (error) {
    console.error('Error starting attacker containers:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/containers/victim-stop
// Stop all victim containers
async function victimStop(req, res) {
  try {
    const stopped = await dockerService.stopContainersByLabel('type', 'MITS-VICTIM');

    res.json({
      success: true,
      message: 'All victim containers stopped',
      count: stopped.length,
      containers: stopped
    });
  } catch (error) {
    console.error('Error stopping victim containers:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/containers/victim-start
// Start all victim containers
async function victimStart(req, res) {
  try {
    const started = await dockerService.startContainersByLabel('type', 'MITS-VICTIM');

    res.json({
      success: true,
      message: 'All victim containers started',
      count: started.length,
      containers: started
    });
  } catch (error) {
    console.error('Error starting victim containers:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createAttacker,
  breach,
  hintAccessed,
  fullStop,
  fullStart,
  attackerStop,
  attackerStart,
  victimStop,
  victimStart
};