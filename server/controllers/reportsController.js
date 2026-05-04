const Complaint = require('../models/Complaint');

// 1. Complaints per category - aggregation pipeline
exports.getComplaintsPerCategory = async (req, res) => {
  try {
    const result = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 2. Complaints per area (location.areaName) - aggregation pipeline
exports.getComplaintsPerArea = async (req, res) => {
  try {
    const result = await Complaint.aggregate([
      {
        $match: {
          'location.areaName': { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$location.areaName',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 3. High priority complaints count - aggregation pipeline
exports.getHighPriorityCount = async (req, res) => {
  try {
    const result = await Complaint.aggregate([
      {
        $match: { priority: 'high' }
      },
      {
        $group: {
          _id: null,
          highPriorityCount: { $sum: 1 },
          complaints: { $push: { title: '$title', status: '$status', area: '$location.areaName' } }
        }
      }
    ]);

    res.json({
      success: true,
      data: result.length > 0 ? result[0] : { highPriorityCount: 0, complaints: [] }
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 4. Monthly complaints trend - aggregation pipeline
exports.getMonthlyTrend = async (req, res) => {
  try {
    const result = await Complaint.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 5. Top 5 hotspot areas - aggregation pipeline
exports.getTopHotspots = async (req, res) => {
  try {
    const result = await Complaint.aggregate([
      {
        $match: {
          'location.areaName': { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$location.areaName',
          complaintCount: { $sum: 1 },
          highPriorityCount: {
            $sum: {
              $cond: [{ $eq: ['$priority', 'high'] }, 1, 0]
            }
          },
          categories: { $addToSet: '$category' },
          statuses: { $addToSet: '$status' }
        }
      },
      {
        $sort: { complaintCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Additional aggregation: Status distribution
exports.getStatusDistribution = async (req, res) => {
  try {
    const result = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Aggregation: Priority distribution
exports.getPriorityDistribution = async (req, res) => {
  try {
    const result = await Complaint.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Aggregation: Complaints with images count
exports.getComplaintsWithImages = async (req, res) => {
  try {
    const result = await Complaint.aggregate([
      {
        $match: {
          images: { $exists: true, $ne: [] }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          averageImageCount: { $avg: { $size: '$images' } }
        }
      }
    ]);

    res.json({
      success: true,
      data: result.length > 0 ? result[0] : { count: 0, averageImageCount: 0 }
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Aggregation: Updates activity log
exports.getUpdateActivity = async (req, res) => {
  try {
    const result = await Complaint.aggregate([
      {
        $unwind: '$updates'
      },
      {
        $group: {
          _id: '$updates.status',
          totalUpdates: { $sum: 1 }
        }
      },
      {
        $sort: { totalUpdates: -1 }
      }
    ]);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
