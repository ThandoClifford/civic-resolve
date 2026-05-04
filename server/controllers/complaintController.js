const Complaint = require('../models/Complaint');

// Create a new complaint
exports.createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority, location, assignedTeam } = req.body;

    const complaint = await Complaint.create({
      title,
      description,
      category,
      priority: priority || 'medium',
      status: 'pending',
      location: {
        areaName: location?.areaName || '',
        coordinates: {
          latitude: location?.coordinates?.latitude,
          longitude: location?.coordinates?.longitude
        }
      },
      assignedTeam: assignedTeam || { name: '', members: [] }
    });

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

// Get all complaints with optional filters
exports.getComplaints = async (req, res) => {
  try {
    const { category, status, priority, search } = req.query;

    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.areaName': { $regex: search, $options: 'i' } }
      ];
    }

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      complaints
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single complaint by ID
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
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

// Update complaint (status, priority, assignedTeam, etc.)
exports.updateComplaint = async (req, res) => {
  try {
    const { status, priority, location, assignedTeam } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    if (status) complaint.status = status;
    if (priority) complaint.priority = priority;
    if (location) {
      if (location.areaName !== undefined) complaint.location.areaName = location.areaName;
      if (location.coordinates) {
        if (location.coordinates.latitude) complaint.location.coordinates.latitude = location.coordinates.latitude;
        if (location.coordinates.longitude) complaint.location.coordinates.longitude = location.coordinates.longitude;
      }
    }
    if (assignedTeam) {
      if (assignedTeam.name !== undefined) complaint.assignedTeam.name = assignedTeam.name;
      if (assignedTeam.members) complaint.assignedTeam.members = assignedTeam.members;
    }

    await complaint.save();

    res.json({
      success: true,
      complaint,
      message: 'Complaint updated successfully'
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add an update to the updates array
exports.addUpdate = async (req, res) => {
  try {
    const { status, comment } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    complaint.updates.unshift({
      status: status || complaint.status,
      comment: comment || '',
      updatedAt: new Date()
    });

    // Update the main status if provided
    if (status) {
      complaint.status = status;
    }

    await complaint.save();

    res.json({
      success: true,
      complaint,
      message: 'Update added successfully'
    });
  } catch (error) {
    console.error('Add update error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add an image to the images array
exports.addImage = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    complaint.images.unshift({
      url,
      uploadedAt: new Date()
    });

    await complaint.save();

    res.json({
      success: true,
      complaint,
      message: 'Image added successfully'
    });
  } catch (error) {
    console.error('Add image error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete complaint
exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
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
