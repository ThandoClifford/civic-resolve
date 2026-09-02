const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const streetlightController = require('../controllers/streetlightController');

router.get('/', requireAuth, requireRole('MUNICIPAL_OFFICIAL', 'ADMIN'), streetlightController.getAllStreetlights);
router.get('/:id', requireAuth, requireRole('MUNICIPAL_OFFICIAL', 'ADMIN'), streetlightController.getStreetlightById);
router.post('/', requireAuth, requireRole('ADMIN'), streetlightController.createStreetlight);
router.patch('/:id', requireAuth, requireRole('ADMIN'), streetlightController.updateStreetlight);

module.exports = router;
