const Telemetry = require('../models/Telemetry');
const Streetlight = require('../models/Streetlight');
const { analyzeTelemetry } = require('../services/faultDetectionService');
const { getIO } = require('../services/socketService');

const badRequest = (res, message) => {
  return res.status(400).json({
    success: false,
    message
  });
};

const emitStreetlightUpdated = (streetlight) => {
  try {
    const io = getIO();
    io.emit('streetlight:updated', {
      streetlightId: streetlight.streetlightId,
      currentLampState: streetlight.currentLampState,
      deviceStatus: streetlight.deviceStatus,
      voltage: streetlight.voltage,
      current: streetlight.current,
      lastSeen: streetlight.lastSeen
    });
    console.log(`[Socket] Emitted streetlight:updated for ${streetlight.streetlightId}`);
  } catch (error) {
    console.error('Socket emit error:', error);
  }
};

const emitFaultEvent = (fault, eventType, streetlight) => {
  try {
    const io = getIO();
    const payload = {
      id: fault._id,
      streetlightId: fault.streetlightId,
      faultType: fault.faultType,
      status: fault.status,
      detectedAt: fault.detectedAt,
      occurrenceCount: fault.occurrenceCount,
      priorityScore: fault.priorityScore,
      priorityLevel: fault.priorityLevel,
      priorityBreakdown: fault.priorityBreakdown,
      priorityExplanation: fault.priorityExplanation,
      streetlight: streetlight
        ? {
            name: streetlight.name,
            installationType: streetlight.installationType,
            location: streetlight.location
          }
        : null
    };

    io.emit(eventType, payload);
    console.log(`[Socket] Emitted ${eventType} for ${fault.streetlightId}`);
  } catch (error) {
    console.error('Socket emit error:', error);
  }
};

const ingestTelemetry = async (req, res) => {
  try {
    const {
      streetlightId,
      lampState,
      voltage,
      current,
      signalStatus,
      timestamp
    } = req.body;

    if (!streetlightId || typeof streetlightId !== 'string') {
      return badRequest(res, 'streetlightId is required');
    }

    const streetlight = await Streetlight.findOne({ streetlightId });
    if (!streetlight) {
      return res.status(404).json({
        success: false,
        message: 'Unknown streetlightId'
      });
    }

    if (!lampState || !['ON', 'OFF', 'UNKNOWN'].includes(lampState)) {
      return badRequest(res, 'lampState must be ON, OFF, or UNKNOWN');
    }

    if (!signalStatus || !['ONLINE', 'OFFLINE'].includes(signalStatus)) {
      return badRequest(res, 'signalStatus must be ONLINE or OFFLINE');
    }

    if (voltage !== undefined && typeof voltage !== 'number') {
      return badRequest(res, 'voltage must be a number');
    }

    if (current !== undefined && typeof current !== 'number') {
      return badRequest(res, 'current must be a number');
    }

    const readingTimestamp = timestamp ? new Date(timestamp) : new Date();
    if (isNaN(readingTimestamp.getTime())) {
      return badRequest(res, 'timestamp must be a valid ISO date');
    }

    const telemetry = new Telemetry({
      streetlight: streetlight._id,
      streetlightId,
      lampState,
      voltage: voltage !== undefined ? voltage : null,
      current: current !== undefined ? current : null,
      signalStatus,
      timestamp: readingTimestamp
    });

    await telemetry.save();

    streetlight.currentLampState = lampState;
    streetlight.voltage = voltage !== undefined ? voltage : streetlight.voltage;
    streetlight.current = current !== undefined ? current : streetlight.current;
    streetlight.lastSeen = readingTimestamp;

    await streetlight.save();

    emitStreetlightUpdated(streetlight);

    let faultsCreated = [];
    let faultsUpdated = [];
    try {
      const result = await analyzeTelemetry(streetlight, telemetry);
      faultsCreated = result.faultsCreated || [];
      faultsUpdated = result.faultsUpdated || [];

      for (const fault of faultsCreated) {
        emitFaultEvent(fault, 'fault:new', streetlight);
      }

      for (const fault of faultsUpdated) {
        emitFaultEvent(fault, 'fault:updated', streetlight);
      }
    } catch (faultError) {
      console.error('Fault detection error:', faultError);
    }

    res.status(201).json({
      success: true,
      telemetry,
      faultsCreated,
      faultsUpdated
    });
  } catch (error) {
    console.error('Ingest telemetry error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error ingesting telemetry'
    });
  }
};

const getTelemetryReadings = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const streetlightId = req.query.streetlightId;

    const query = {};
    if (streetlightId) {
      query.streetlightId = streetlightId;
    }

    const readings = await Telemetry.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({
      success: true,
      count: readings.length,
      readings
    });
  } catch (error) {
    console.error('Get telemetry error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching telemetry'
    });
  }
};

const getTelemetryByStreetlightId = async (req, res) => {
  try {
    const { streetlightId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

    const streetlight = await Streetlight.findOne({ streetlightId });
    if (!streetlight) {
      return res.status(404).json({
        success: false,
        message: 'Streetlight not found'
      });
    }

    const readings = await Telemetry.find({ streetlightId })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({
      success: true,
      streetlightId,
      count: readings.length,
      readings
    });
  } catch (error) {
    console.error('Get telemetry by streetlight error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching telemetry'
    });
  }
};

module.exports = {
  ingestTelemetry,
  getTelemetryReadings,
  getTelemetryByStreetlightId
};
