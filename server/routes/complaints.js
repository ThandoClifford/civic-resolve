const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  getMyComplaints,
  getStats
} = require('../controllers/complaintController');
const { protect, adminOnly } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed!'), false);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

router.post('/', protect, upload.single('image'), createComplaint);
router.get('/', protect, getComplaints);
router.get('/stats', protect, getStats);
router.get('/my', protect, getMyComplaints);
router.get('/:id', protect, getComplaintById);
router.put('/:id/status', protect, adminOnly, updateComplaintStatus);
router.delete('/:id', protect, deleteComplaint);

module.exports = router;