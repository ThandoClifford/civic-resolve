const mongoose = require('mongoose');

const faultSchema = new mongoose.Schema({
  streetlight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Streetlight',
    required: true,
    index: true
  },
  streetlightId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  faultType: {
    type: String,
    enum: ['LAMP_FAILURE', 'FLICKERING', 'DEVICE_OFFLINE', 'LOW_CURRENT', 'OTHER'],
    required: true
  },
  status: {
    type: String,
    enum: ['DETECTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
    default: 'DETECTED',
    index: true
  },
  detectedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  description: {
    type: String,
    trim: true,
    default: ''
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
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  lastDetectedAt: {
    type: Date,
    default: null
  },
  occurrenceCount: {
    type: Number,
    min: 1,
    default: 1
  },
  priorityBreakdown: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  priorityExplanation: {
    type: String,
    trim: true,
    default: ''
  },
  priorityCalculatedAt: {
    type: Date,
    default: null
  },
  lastAlertedPriorityLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: null
  },
  lastAlertedAt: {
    type: Date,
    default: null
  },
  activity: [
    {
      action: {
        type: String,
        required: true,
        trim: true
      },
      fromStatus: {
        type: String,
        trim: true
      },
      toStatus: {
        type: String,
        trim: true
      },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        required: true,
        default: Date.now
      },
      note: {
        type: String,
        trim: true,
        default: ''
      }
    }
  ]
}, {
  timestamps: true
});

faultSchema.index({ streetlight: 1, status: 1 });
faultSchema.index({ streetlightId: 1, detectedAt: -1 });

module.exports = mongoose.model('Fault', faultSchema);
