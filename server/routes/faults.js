const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const faultController = require('../controllers/faultController');

router.get('/', requireAuth, requireRole('MUNICIPAL_OFFICIAL', 'ADMIN'), faultController.getFaults);
router.get('/:id', requireAuth, requireRole('MUNICIPAL_OFFICIAL', 'ADMIN'), faultController.getFaultById);
router.patch('/:id/status', requireAuth, requireRole('MUNICIPAL_OFFICIAL', 'ADMIN'), faultController.updateFaultStatus);

module.exports = router;
