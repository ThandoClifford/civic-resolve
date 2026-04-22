const express = require('express');
const router = express.Router();
const { getSummary, getHotspots, getDashboardStats } = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/summary', protect, adminOnly, getSummary);
router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/hotspots', protect, getHotspots);

module.exports = router;