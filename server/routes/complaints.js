const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth, requireRole } = require('../middleware/auth');
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  addUpdate,
  addImage,
  deleteComplaint,
  calculateComplaintPriority,
  getRelatedComplaints
} = require('../controllers/complaintController');

// CRUD endpoints
router.post('/', requireAuth, createComplaint);
router.get('/', optionalAuth, getComplaints);
router.get('/:id', optionalAuth, getComplaintById);
router.get('/:id/related', requireAuth, getRelatedComplaints);
router.put('/:id', requireAuth, updateComplaint);
router.delete('/:id', requireAuth, deleteComplaint);

// Array operations
router.post('/:id/updates', requireAuth, addUpdate);
router.post('/:id/images', requireAuth, addImage);
router.post('/:id/calculate-priority', requireAuth, requireRole('MUNICIPAL_OFFICIAL', 'ADMIN'), calculateComplaintPriority);

module.exports = router;
