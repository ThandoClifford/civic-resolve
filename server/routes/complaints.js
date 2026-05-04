const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  addUpdate,
  addImage,
  deleteComplaint
} = require('../controllers/complaintController');

// CRUD endpoints
router.post('/', createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.put('/:id', updateComplaint);
router.delete('/:id', deleteComplaint);

// Array operations
router.post('/:id/updates', addUpdate);
router.post('/:id/images', addImage);

module.exports = router;
