const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Illegal Dumping', 'Water Leak', 'Road Damage', 'Electricity Fault', 'Other'],
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  safetyRisk: {
    type: String,
    enum: ['none', 'low', 'medium', 'high', 'critical'],
    default: 'none'
  },
  environmentalImpact: {
    type: String,
    enum: ['none', 'low', 'medium', 'high'],
    default: 'none'
  },
  peopleAffected: {
    type: Number,
    min: 0,
    default: 0
  },
  locationSensitivity: {
    type: String,
    enum: ['normal_residential', 'business_commercial', 'public_transport_area', 'high_density_public_area', 'school', 'hospital'],
    default: 'normal_residential'
  },
  priorityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  priorityLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: null
  },
  priorityBreakdown: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  priorityExplanation: {
    type: String,
    default: ''
  },
  priorityCalculatedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'in_progress', 'resolved'],
    default: 'pending',
    index: true
  },
  location: {
    areaName: {
      type: String,
      trim: true,
      index: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
      }
    }
  },
  assignedTeam: {
    name: {
      type: String,
      trim: true
    },
    members: [{
      type: String,
      trim: true
    }]
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  relatedIssues: [{
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true
    },
    similarityScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    relationshipLevel: {
      type: String,
      enum: ['UNRELATED', 'POSSIBLY_RELATED', 'LIKELY_RELATED', 'STRONGLY_RELATED'],
      required: true
    },
    breakdown: {
      geographic: { type: Number, min: 0, max: 35, default: 0 },
      category: { type: Number, min: 0, max: 25, default: 0 },
      text: { type: Number, min: 0, max: 25, default: 0 },
      time: { type: Number, min: 0, max: 15, default: 0 }
    },
    explanation: {
      type: String,
      default: ''
    },
    distanceKm: {
      type: Number,
      default: null
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  updates: [{
    status: {
      type: String,
      enum: ['pending', 'under_review', 'in_progress', 'resolved']
    },
    comment: {
      type: String,
      trim: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

complaintSchema.index({ 'relatedIssues.complaintId': 1 });

// Text search index
complaintSchema.index({ title: 'text', description: 'text', 'location.areaName': 'text' });

// Pre-save hook
complaintSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Statistic aggregation method
complaintSchema.statics.getStats = async function () {
  const total = await this.countDocuments();
  const resolved = await this.countDocuments({ status: 'resolved' });
  const unresolved = await this.countDocuments({ status: { $ne: 'resolved' } });

  const byCategory = await this.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  const byStatus = await this.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const byPriority = await this.aggregate([
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  return {
    total,
    resolved,
    unresolved,
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
    }, {})
  };
};

module.exports = mongoose.model('Complaint', complaintSchema);
