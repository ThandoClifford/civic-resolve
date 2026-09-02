const Fault = require('../models/Fault');
const Streetlight = require('../models/Streetlight');
const { calculatePriority } = require('../services/smartlightPriorityService');
const { getIO } = require('../services/socketService');

const recalculateFaultPriority = async (fault) => {
  if (!fault || !['DETECTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'].includes(fault.status)) {
    return fault;
  }

  const streetlight = await Streetlight.findById(fault.streetlight)
    .select('installationType')
    .lean();

  if (!streetlight) {
    return fault;
  }

  const result = calculatePriority(fault, streetlight);

  const changed =
    fault.priorityScore !== result.priorityScore ||
    fault.priorityLevel !== result.priorityLevel ||
    JSON.stringify(fault.priorityBreakdown) !== JSON.stringify(result.priorityBreakdown) ||
    fault.priorityExplanation !== result.priorityExplanation;

  if (changed) {
    fault.priorityScore = result.priorityScore;
    fault.priorityLevel = result.priorityLevel;
    fault.priorityBreakdown = result.priorityBreakdown;
    fault.priorityExplanation = result.priorityExplanation;
    fault.priorityCalculatedAt = result.priorityCalculatedAt;
    await fault.save();
  }

  return fault;
};

const emitFaultEvent = async (fault, eventType) => {
  try {
    const io = getIO();
    const populatedFault = await Fault.findById(fault._id)
      .populate('streetlight', 'streetlightId name areaName installationType location');

    const payload = {
      id: populatedFault._id,
      streetlightId: populatedFault.streetlightId,
      faultType: populatedFault.faultType,
      status: populatedFault.status,
      detectedAt: populatedFault.detectedAt,
      occurrenceCount: populatedFault.occurrenceCount,
      priorityScore: populatedFault.priorityScore,
      priorityLevel: populatedFault.priorityLevel,
      priorityBreakdown: populatedFault.priorityBreakdown,
      priorityExplanation: populatedFault.priorityExplanation,
      streetlight: populatedFault.streetlight
        ? {
            name: populatedFault.streetlight.name,
            installationType: populatedFault.streetlight.installationType,
            location: populatedFault.streetlight.location
          }
        : null
    };

    io.emit(eventType, payload);
    console.log(`[Socket] Emitted ${eventType} for ${populatedFault.streetlightId}`);
  } catch (error) {
    console.error('Socket emit error:', error);
  }
};

  const getFaults = async (req, res) => {
  try {
    const { status, faultType, streetlightId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (faultType) query.faultType = faultType;
    if (streetlightId) query.streetlightId = streetlightId;

    const faults = await Fault.find(query)
      .sort({ priorityScore: -1, detectedAt: 1 })
      .populate('streetlight', 'streetlightId name areaName installationType location')
      .populate('activity.performedBy', 'name email');

    for (const fault of faults) {
      await recalculateFaultPriority(fault);
    }

    res.json({
      success: true,
      count: faults.length,
      faults
    });
  } catch (error) {
    console.error('Get faults error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching faults'
    });
  }
};

  const getFaultById = async (req, res) => {
  try {
    const fault = await Fault.findById(req.params.id)
      .populate('streetlight', 'streetlightId name areaName installationType location')
      .populate('activity.performedBy', 'name email');

    if (!fault) {
      return res.status(404).json({
        success: false,
        message: 'Fault not found'
      });
    }

    await recalculateFaultPriority(fault);

    res.json({
      success: true,
      fault
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching fault'
    });
  }
};

const updateFaultStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['DETECTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const fault = await Fault.findById(req.params.id);

    if (!fault) {
      return res.status(404).json({
        success: false,
        message: 'Fault not found'
      });
    }

    const previousStatus = fault.status;

    if (previousStatus === 'RESOLVED') {
      return res.status(400).json({
        success: false,
        message: 'Resolved faults cannot be modified. Create a new fault record if needed.'
      });
    }

    const allowedTransitions = {
      DETECTED: ['ACKNOWLEDGED'],
      ACKNOWLEDGED: ['ASSIGNED'],
      ASSIGNED: ['IN_PROGRESS'],
      IN_PROGRESS: ['RESOLVED']
    };

    const permittedNext = allowedTransitions[previousStatus];
    if (!permittedNext || !permittedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${previousStatus} to ${status}. Allowed next: ${permittedNext.join(', ')}`
      });
    }

    fault.status = status;

    if (status === 'RESOLVED') {
      fault.resolvedAt = new Date();
    }

    fault.activity.push({
      action: 'STATUS_CHANGED',
      fromStatus: previousStatus,
      toStatus: status,
      performedBy: req.user?._id || null,
      timestamp: new Date(),
      note: ''
    });

    await fault.save();

    emitFaultEvent(fault, 'fault:updated');

    if (status === 'RESOLVED') {
      emitFaultEvent(fault, 'fault:resolved');
    }

    res.json({
      success: true,
      fault,
      message: 'Fault status updated successfully'
    });
  } catch (error) {
    console.error('Update fault status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating fault status'
    });
  }
};

module.exports = {
  getFaults,
  getFaultById,
  updateFaultStatus,
  recalculateFaultPriority
};
