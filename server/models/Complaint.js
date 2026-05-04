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
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true
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

// Compound index for geospatial queries
complaintSchema.index({ 'location.coordinates': '2dsphere' });

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
