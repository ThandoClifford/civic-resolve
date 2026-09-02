const express = require('express');
const router = express.Router();
const { requireDeviceApiKey } = require('../middleware/deviceAuth');
const { requireAuth, requireRole } = require('../middleware/auth');
const telemetryController = require('../controllers/telemetryController');

router.post('/', requireDeviceApiKey, telemetryController.ingestTelemetry);
router.get('/', requireAuth, requireRole('MUNICIPAL_OFFICIAL', 'ADMIN'), telemetryController.getTelemetryReadings);
router.get('/:streetlightId', requireAuth, requireRole('MUNICIPAL_OFFICIAL', 'ADMIN'), telemetryController.getTelemetryByStreetlightId);

module.exports = router;
