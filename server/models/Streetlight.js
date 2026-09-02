const mongoose = require('mongoose');

const streetlightSchema = new mongoose.Schema({
  streetlightId: {
    type: String,
    required: [true, 'Streetlight ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    trim: true,
    default: ''
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
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  installationType: {
    type: String,
    enum: ['RESIDENTIAL', 'MAIN_ROAD', 'PEDESTRIAN_CROSSING', 'SCHOOL', 'CLINIC', 'TAXI_RANK', 'OTHER'],
    default: 'OTHER'
  },
  expectedLampState: {
    type: String,
    enum: ['ON', 'OFF'],
    default: 'ON'
  },
  currentLampState: {
    type: String,
    enum: ['ON', 'OFF', 'UNKNOWN'],
    default: 'UNKNOWN'
  },
  deviceStatus: {
    type: String,
    enum: ['ONLINE', 'WARNING', 'FAULT', 'OFFLINE'],
    default: 'UNKNOWN'
  },
  voltage: {
    type: Number,
    default: null
  },
  current: {
    type: Number,
    default: null
  },
  lastSeen: {
    type: Date,
    default: null
  },
  installedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Streetlight', streetlightSchema);
