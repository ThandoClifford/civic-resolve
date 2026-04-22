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
  imageUrl: {
    type: String,
    default: null
  },
  latitude: {
    type: Number,
    required: [true, 'Latitude is required'],
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required'],
    min: -180,
    max: 180
  },
  address: {
    type: String,
    trim: true,
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
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  }
});

complaintSchema.index({ title: 'text', description: 'text', address: 'text' });

complaintSchema.index({ latitude: 1, longitude: 1 });

complaintSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = Date.now();
  }
  next();
});

complaintSchema.methods.getDuration = function () {
  if (this.resolvedAt && this.createdAt) {
    return Math.round((this.resolvedAt - this.createdAt) / (1000 * 60 * 60 * 24));
  }
  return null;
};

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