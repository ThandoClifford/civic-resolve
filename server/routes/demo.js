const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { requireDeviceApiKey } = require('../middleware/deviceAuth');
const { getState, setMode, applyScenario } = require('../services/demoStateService');

const authenticateDemoState = (req, res, next) => {
  const deviceKey = req.headers['x-device-api-key'];
  const expectedKey = process.env.DEVICE_API_KEY;

  if (expectedKey && deviceKey && deviceKey === expectedKey) {
    return next();
  }

  return requireAuth(req, res, () => requireRole('ADMIN', 'MUNICIPAL_OFFICIAL')(req, res, next));
};

router.get('/state', authenticateDemoState, async (req, res) => {
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
    const { scenario, type } = req.body;
    const input = type ? `${scenario}:${type}` : scenario;
    const result = await applyScenario(input);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Server error applying scenario' });
  }
});

module.exports = router;
