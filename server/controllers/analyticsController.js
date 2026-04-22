const Complaint = require('../models/Complaint');

exports.getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const baseMatch = Object.keys(dateFilter).length > 0 ? dateFilter : {};

    const totalComplaints = await Complaint.countDocuments(baseMatch);

    const byCategory = await Complaint.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const byStatus = await Complaint.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const byPriority = await Complaint.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const resolvedComplaints = await Complaint.find({ 
      status: 'resolved',
      ...(Object.keys(dateFilter).length > 0 ? dateFilter : {})
    });
    
    let avgResolutionTime = 0;
    let resolutionCount = 0;
    
    if (resolvedComplaints.length > 0) {
      const totalTime = resolvedComplaints.reduce((sum, c) => {
        if (c.resolvedAt && c.createdAt) {
          resolutionCount++;
          return sum + (c.resolvedAt - c.createdAt);
        }
        return sum;
      }, 0);
      avgResolutionTime = resolutionCount > 0 ? totalTime / resolutionCount / (1000 * 60 * 60 * 24) : 0;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyTrend = await Complaint.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const topAreas = await Complaint.aggregate([
      { $match: { ...baseMatch, address: { $exists: true, $ne: '' } } },
      { $group: { _id: '$address', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const illegalDumpingCount = await Complaint.countDocuments({ 
      category: 'Illegal Dumping',
      ...baseMatch 
    });

    const illegalDumpingResolved = await Complaint.countDocuments({ 
      category: 'Illegal Dumping',
      status: 'resolved'
    });

    const unresolved = await Complaint.countDocuments({ 
      status: { $ne: 'resolved' },
      ...baseMatch
    });

    const pending = await Complaint.countDocuments({ 
      status: 'pending',
      ...baseMatch
    });

    const inProgress = await Complaint.countDocuments({ 
      status: { $in: ['under_review', 'in_progress'] },
      ...baseMatch
    });

    const resolutionRate = totalComplaints > 0 ? 
      Math.round((byStatus.find(s => s._id === 'resolved')?.count || 0) / totalComplaints * 100) : 0;

    res.json({
      success: true,
      summary: {
        totalComplaints,
        resolved: byStatus.find(s => s._id === 'resolved')?.count || 0,
        unresolved,
        pending,
        inProgress,
        resolutionRate,
        byCategory: byCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        monthlyTrend,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        topAreas,
        illegalDumpingCount,
        illegalDumpingResolved,
        avgResolutionTime
      }
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getHotspots = async (req, res) => {
  try {
    const { includeResolved = 'false' } = req.query;
    
    const query = { category: 'Illegal Dumping' };
    if (includeResolved === 'false') {
      query.status = { $ne: 'resolved' };
    }

    const complaints = await Complaint.find(query)
      .select('latitude longitude address createdAt status priority')
      .lean();

    const GRID_SIZE = 0.005;
    const grid = {};

    complaints.forEach((complaint) => {
      const lat = complaint.latitude;
      const lng = complaint.longitude;
      
      const gridLat = Math.floor(lat / GRID_SIZE) * GRID_SIZE;
      const gridLng = Math.floor(lng / GRID_SIZE) * GRID_SIZE;
      const key = `${gridLat.toFixed(4)},${gridLng.toFixed(4)}`;
      
      if (!grid[key]) {
        grid[key] = {
          count: 0,
          lat: gridLat + GRID_SIZE / 2,
          lng: gridLng + GRID_SIZE / 2,
          address: complaint.address,
          complaints: [],
          highPriority: 0
        };
      }
      
      grid[key].count++;
      if (complaint.priority === 'high') {
        grid[key].highPriority++;
      }
      grid[key].complaints.push(complaint._id);
    });

    const hotspots = Object.entries(grid).map(([key, data]) => {
      let riskLevel;
      let riskScore = data.count;
      
      if (data.highPriority > 0) {
        riskScore += data.highPriority * 2;
      }
      
      if (riskScore >= 5) {
        riskLevel = 'high';
      } else if (riskScore >= 3) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }
      
      return {
        id: key,
        latitude: data.lat,
        longitude: data.lng,
        count: data.count,
        riskLevel,
        riskScore,
        address: data.address,
        highPriorityCount: data.highPriority
      };
    });

    hotspots.sort((a, b) => b.riskScore - a.riskScore);

    const highRiskAreas = hotspots.filter(h => h.riskLevel === 'high');
    const mediumRiskAreas = hotspots.filter(h => h.riskLevel === 'medium');
    const lowRiskAreas = hotspots.filter(h => h.riskLevel === 'low');

    res.json({
      success: true,
      hotspots,
      totalHotspots: hotspots.length,
      highRiskAreas: highRiskAreas.length,
      mediumRiskAreas: mediumRiskAreas.length,
      lowRiskAreas: lowRiskAreas.length,
      totalReports: complaints.length,
      summary: {
        hotspots: hotspots.length,
        high: highRiskAreas.length,
        medium: mediumRiskAreas.length,
        low: lowRiskAreas.length,
        topTen: hotspots.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Hotspots error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: 'resolved' });
    const pending = await Complaint.countDocuments({ status: 'pending' });
    const inProgress = await Complaint.countDocuments({ 
      status: { $in: ['under_review', 'in_progress'] } 
    });
    const illegalDumping = await Complaint.countDocuments({ category: 'Illegal Dumping' });
    const illegalDumpingResolved = await Complaint.countDocuments({ 
      category: 'Illegal Dumping',
      status: 'resolved'
    });

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const illegalDumpingResolutionRate = illegalDumping > 0 ? 
      Math.round((illegalDumpingResolved / illegalDumping) * 100) : 0;

    const topCategories = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const topPriority = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const recentComplaints = await Complaint.find()
      .populate('reportedBy', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        total,
        resolved,
        pending,
        inProgress,
        resolutionRate,
        illegalDumping: {
          total: illegalDumping,
          resolved: illegalDumpingResolved,
          resolutionRate: illegalDumpingResolutionRate
        },
        topCategories,
        topPriority,
        recentComplaints
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};