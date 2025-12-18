const dockerService = require('../services/dockerService');

// POST /api/createattacker
// Create a new attacker container with weTTY terminal
// Body: { "name": "attacker-custom" } (optional)
// Returns: { id, name, terminal_url }
async function createAttacker(req, res) {
  try {
    const { name } = req.body;

    // Delegate to service
    const container = await dockerService.createAttacker(name);

    res.status(201).json({
      success: true,
      message: 'Attacker container created and started',
      container,
    });
  } catch (error) {
    console.error('Error creating attacker:', error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/containers/:id/terminal
// Get terminal URL for a container
async function getTerminal(req, res) {
  try {
    const { id } = req.params;
    const terminal = dockerService.getTerminalUrl(id);

    res.json({
      success: true,
      ...terminal,
    });
  } catch (error) {
    console.error('Error getting terminal:', error);
    res.status(404).json({ error: error.message });
  }
}

module.exports = {
  createAttacker,
  getTerminal,
};
