const Fault = require('../models/Fault');
const { getIO } = require('./socketService');

const ESCALATION_DELAY_MS = parseInt(process.env.SMARTLIGHT_ESCALATION_DELAY_MS || '60000', 10);
const ESCALATION_STATUS_PENDING = 'PENDING';
const ESCALATION_STATUS_ESCALATED = 'ESCALATED';
const ADMIN_ROOM = 'role:ADMIN';

const timers = new Map();

const buildMessage = (fault, streetlight) => {
  const area = streetlight?.location?.areaName || 'unknown area';
  return `CRITICAL fault escalation: ${fault.streetlightId} at ${area} has remained unacknowledged for 60 seconds.`;
};

const buildPayload = async (fault) => {
  const populated = await Fault.findById(fault._id)
    .populate('streetlight', 'streetlightId name areaName installationType location');

  const streetlight = populated.streetlight;
  return {
    faultId: populated._id,
    streetlightId: populated.streetlightId,
    streetlightName: streetlight?.name || '--',
    areaName: streetlight?.location?.areaName || '--',
    faultType: populated.faultType,
    priorityScore: populated.priorityScore,
    priorityLevel: populated.priorityLevel,
    status: populated.status,
    message: buildMessage(populated, streetlight),
    escalatedAt: populated.escalatedAt || new Date()
  };
};

const emitEscalation = async (fault) => {
  try {
    const io = getIO();
    const payload = await buildPayload(fault);
    io.to(ADMIN_ROOM).emit('smartlight:escalation', payload);
    console.log(`[Socket] Emitted smartlight:escalation for ${payload.streetlightId}`);
  } catch (error) {
    console.error('Socket escalation emit error:', error);
  }
};

const scheduleEscalation = async (fault) => {
  if (!fault || fault.escalationStatus === ESCALATION_STATUS_ESCALATED) {
    return null;
  }

  if (fault.escalationStatus === ESCALATION_STATUS_PENDING) {
    return null;
  }

  fault.escalationStatus = ESCALATION_STATUS_PENDING;
  fault.escalationScheduledAt = new Date(Date.now() + ESCALATION_DELAY_MS);
  await fault.save();

  const timer = setTimeout(async () => {
    timers.delete(fault._id.toString());

    const latest = await Fault.findById(fault._id);
    if (!latest) {
      return;
    }

    if (
      latest.priorityLevel === 'CRITICAL' &&
      latest.status === 'DETECTED' &&
      ['DETECTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'].includes(latest.status) &&
      latest.escalationStatus === ESCALATION_STATUS_PENDING
    ) {
      latest.escalationStatus = ESCALATION_STATUS_ESCALATED;
      latest.escalatedAt = new Date();
      await latest.save();

      await emitEscalation(latest);
    }
  }, ESCALATION_DELAY_MS);

  timers.set(fault._id.toString(), timer);
  return fault;
};

const cancelEscalation = async (fault) => {
  if (!fault) {
    return;
  }

  const timer = timers.get(fault._id.toString());
  if (timer) {
    clearTimeout(timer);
    timers.delete(fault._id.toString());
  }

  if (fault.escalationStatus === ESCALATION_STATUS_PENDING) {
    fault.escalationStatus = 'NONE';
    fault.escalationScheduledAt = null;
    await fault.save();
  }
};

const recoverPendingEscalations = async () => {
  try {
    const pendingFaults = await Fault.find({
      escalationStatus: ESCALATION_STATUS_PENDING,
      status: { $in: ['DETECTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'] },
      priorityLevel: 'CRITICAL'
    });

    for (const fault of pendingFaults) {
      const scheduledAt = fault.escalationScheduledAt ? new Date(fault.escalationScheduledAt).getTime() : 0;
      const remaining = scheduledAt - Date.now();

      if (remaining <= 0) {
        fault.escalationStatus = ESCALATION_STATUS_ESCALATED;
        fault.escalatedAt = new Date();
        await fault.save();
        await emitEscalation(fault);
      } else {
        scheduleEscalation(fault);
      }
    }
  } catch (error) {
    console.error('Escalation recovery error:', error);
  }
};

module.exports = {
  scheduleEscalation,
  cancelEscalation,
  recoverPendingEscalations,
  emitEscalation
};
