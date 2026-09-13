const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { requireDeviceApiKey } = require('../middleware/deviceAuth');
const { getState, setMode, applyScenario } = require('../services/demoStateService');

router.get('/state', requireDeviceApiKey, async (req, res) => {
  try {
    res.json({ success: true, state: getState() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error fetching demo state' });
  }
});

router.post('/mode', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { mode } = req.body;
    const result = await setMode(mode);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Server error updating operating mode' });
  }
});

router.post('/scenario', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { scenario } = req.body;
    const result = await applyScenario(scenario);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Server error applying scenario' });
  }
});

module.exports = router;
