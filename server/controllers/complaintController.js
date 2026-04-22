const Complaint = require('../models/Complaint');

exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, latitude, longitude, address, priority } = req.body;

    const complaint = await Complaint.create({
      title,
      description,
      category,
      latitude,
      longitude,
      address,
      priority: priority || 'medium',
      reportedBy: req.user.id,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null
    });

    await complaint.populate('reportedBy', 'fullName email');

    res.status(201).json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating complaint'
    });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const {
      category,
      status,
      priority,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (req.user.role !== 'admin') {
      query.reportedBy = req.user.id;
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const complaints = await Complaint.find(query)
      .populate('reportedBy', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(query);

    res.json({
      success: true,
      complaints,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('reportedBy', 'fullName email')
      .populate('assignedTo', 'fullName email');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (req.user.role !== 'admin' && complaint.reportedBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this complaint'
      });
    }

    res.json({
      success: true,
      complaint
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const oldStatus = complaint.status;
    
    if (status) complaint.status = status;
    if (priority) complaint.priority = priority;
    if (assignedTo !== undefined) complaint.assignedTo = assignedTo;

    await complaint.save();

    const updatedComplaint = await Complaint.findById(req.params.id)
      .populate('reportedBy', 'fullName email')
      .populate('assignedTo', 'fullName email');

    res.json({
      success: true,
      complaint: updatedComplaint,
      message: updatedComplaint.status !== oldStatus ? 
        `Complaint status updated to ${updatedComplaint.status}` : 
        'Complaint updated successfully'
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (req.user.role !== 'admin' && complaint.reportedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this complaint'
      });
    }

    await complaint.deleteOne();

    res.json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyComplaints = async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    
    const query = { reportedBy: req.user.id };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const complaints = await Complaint.find(query)
      .populate('reportedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      complaints,
      total: complaints.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const stats = await Complaint.getStats();
    
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};