const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
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
  lampState: {
    type: String,
    enum: ['ON', 'OFF', 'UNKNOWN'],
    required: true
  },
  voltage: {
    type: Number,
    default: null
  },
  current: {
    type: Number,
    default: null
  },
  signalStatus: {
    type: String,
    enum: ['ONLINE', 'OFFLINE'],
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

telemetrySchema.index({ streetlight: 1, timestamp: -1 });

module.exports = mongoose.model('Telemetry', telemetrySchema);
