const express = require('express');
const router = express.Router();
const {
  getComplaintsPerCategory,
  getComplaintsPerArea,
  getHighPriorityCount,
  getMonthlyTrend,
  getTopHotspots,
  getStatusDistribution,
  getPriorityDistribution,
  getComplaintsWithImages,
  getUpdateActivity
} = require('../controllers/reportsController');

// All aggregation endpoints - no auth required for this mini project
router.get('/category', getComplaintsPerCategory);
router.get('/area', getComplaintsPerArea);
router.get('/high-priority', getHighPriorityCount);
router.get('/monthly-trend', getMonthlyTrend);
router.get('/hotspots', getTopHotspots);

// Additional useful reports
router.get('/status', getStatusDistribution);
router.get('/priority', getPriorityDistribution);
router.get('/images', getComplaintsWithImages);
router.get('/activity', getUpdateActivity);

module.exports = router;
