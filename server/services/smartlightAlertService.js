const Fault = require('../models/Fault');
const { getIO } = require('./socketService');

const ALERTABLE_PRIORITY_LEVELS = new Set(['HIGH', 'CRITICAL']);

const buildMessage = (fault, streetlight, priorityLevel) => {
  const urgency = priorityLevel === 'CRITICAL' ? 'urgent ' : '';
  const area = streetlight?.location?.areaName || 'unknown area';
  return `${priorityLevel} streetlight fault detected: ${fault.streetlightId} at ${area} requires ${urgency}maintenance attention.`;
};

const checkAndEmitAlert = async (fault, previousPriorityLevel) => {
  const currentLevel = fault.priorityLevel;

  if (!ALERTABLE_PRIORITY_LEVELS.has(currentLevel)) {
    return null;
  }

  const isNewFault = !previousPriorityLevel;

  let shouldAlert = false;
  if (isNewFault) {
    shouldAlert = true;
  } else if (previousPriorityLevel === 'HIGH' && currentLevel === 'CRITICAL') {
    shouldAlert = true;
  } else if ((previousPriorityLevel === 'LOW' || previousPriorityLevel === 'MEDIUM') && (currentLevel === 'HIGH' || currentLevel === 'CRITICAL')) {
    shouldAlert = true;
  }

  if (!shouldAlert) {
    return null;
  }

  if (fault.lastAlertedPriorityLevel === currentLevel) {
    return null;
  }

  fault.lastAlertedPriorityLevel = currentLevel;
  fault.lastAlertedAt = new Date();
  await fault.save();

  const populated = await Fault.findById(fault._id)
    .populate('streetlight', 'streetlightId name areaName installationType location');

  const streetlight = populated.streetlight;
  const payload = {
    faultId: populated._id,
    streetlightId: populated.streetlightId,
    streetlightName: streetlight?.name || '--',
    areaName: streetlight?.location?.areaName || '--',
    faultType: populated.faultType,
    priorityScore: populated.priorityScore,
    priorityLevel: populated.priorityLevel,
    message: buildMessage(populated, streetlight, currentLevel),
    createdAt: populated.lastAlertedAt || new Date()
  };

   try {
     const io = getIO();
     io.emit('smartlight:alert', payload);
     console.log(`[Socket] Emitted smartlight:alert for ${populated.streetlightId}`);
   } catch (error) {
     console.error('Socket alert emit error:', error);
   }

  if (currentLevel === 'CRITICAL') {
    const { scheduleEscalation } = require('./smartlightEscalationService');
    await scheduleEscalation(fault);
  }

  return payload;
};

module.exports = {
  checkAndEmitAlert
};
