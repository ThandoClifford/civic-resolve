const Streetlight = require('../models/Streetlight');

const getAllStreetlights = async (req, res) => {
  try {
    const streetlights = await Streetlight.find().sort({ streetlightId: 1 });
    res.json({
      success: true,
      count: streetlights.length,
      streetlights
    });
  } catch (error) {
    console.error('Get streetlights error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching streetlights'
    });
  }
};

const getStreetlightById = async (req, res) => {
  try {
    const streetlight = await Streetlight.findById(req.params.id);

    if (!streetlight) {
      return res.status(404).json({
        success: false,
        message: 'Streetlight not found'
      });
    }

    res.json({
      success: true,
      streetlight
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching streetlight'
    });
  }
};

const createStreetlight = async (req, res) => {
  try {
    const {
      streetlightId,
      name,
      location,
      installationType,
      expectedLampState,
      currentLampState,
      deviceStatus,
      voltage,
      current,
      lastSeen,
      installedAt,
      isActive
    } = req.body;

    const existing = await Streetlight.findOne({ streetlightId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Streetlight ID already exists'
      });
    }

    const streetlight = new Streetlight({
      streetlightId,
      name: name || '',
      location: location || { areaName: '', coordinates: { latitude: null, longitude: null } },
      installationType: installationType || 'OTHER',
      expectedLampState: expectedLampState || 'ON',
      currentLampState: currentLampState || 'UNKNOWN',
      deviceStatus: deviceStatus || 'UNKNOWN',
      voltage,
      current,
      lastSeen: lastSeen || null,
      installedAt: installedAt || null,
      isActive: isActive !== undefined ? isActive : true
    });

    await streetlight.save();

    res.status(201).json({
      success: true,
      streetlight
    });
  } catch (error) {
    console.error('Create streetlight error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating streetlight'
    });
  }
};

const updateStreetlight = async (req, res) => {
  try {
    const streetlight = await Streetlight.findById(req.params.id);

    if (!streetlight) {
      return res.status(404).json({
        success: false,
        message: 'Streetlight not found'
      });
    }

    const allowedUpdates = [
      'name',
      'location',
      'installationType',
      'expectedLampState',
      'currentLampState',
      'deviceStatus',
      'voltage',
      'current',
      'lastSeen',
      'installedAt',
      'isActive'
    ];

    const updates = req.body;
    for (const key of Object.keys(updates)) {
      if (!allowedUpdates.includes(key)) {
        continue;
      }
      streetlight.set(key, updates[key]);
    }

    await streetlight.save();

    res.json({
      success: true,
      streetlight,
      message: 'Streetlight updated successfully'
    });
  } catch (error) {
    console.error('Update streetlight error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating streetlight'
    });
  }
};

module.exports = {
  getAllStreetlights,
  getStreetlightById,
  createStreetlight,
  updateStreetlight
};
