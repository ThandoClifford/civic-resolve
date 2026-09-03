const Fault = require('../models/Fault');
const Streetlight = require('../models/Streetlight');
const { calculatePriority } = require('./smartlightPriorityService');

const LAMP_FAILURE_CURRENT_THRESHOLD = 0.05;
const LOW_CURRENT_THRESHOLD = 0.2;
const UNRESOLVED_STATUSES = ['DETECTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'];

const findUnresolvedFault = async (streetlightId, faultType) => {
  return await Fault.findOne({
    streetlightId,
    faultType,
    status: { $in: UNRESOLVED_STATUSES }
  });
};

const applyPriority = async (fault, streetlight) => {
  const previousPriorityLevel = fault.priorityLevel;
  const result = calculatePriority(fault, streetlight);
  fault.priorityScore = result.priorityScore;
  fault.priorityLevel = result.priorityLevel;
  fault.priorityBreakdown = result.priorityBreakdown;
  fault.priorityExplanation = result.priorityExplanation;
  fault.priorityCalculatedAt = result.priorityCalculatedAt;
  await fault.save();

  const { checkAndEmitAlert } = require('./smartlightAlertService');
  await checkAndEmitAlert(fault, previousPriorityLevel);

  return fault;
};

const createFault = async (streetlight, faultType, description) => {
  const fault = new Fault({
    streetlight: streetlight._id,
    streetlightId: streetlight.streetlightId,
    faultType,
    status: 'DETECTED',
    detectedAt: new Date(),
    description,
    priorityScore: null,
    priorityLevel: 'LOW',
    occurrenceCount: 1,
    activity: [
      {
        action: 'FAULT_DETECTED',
        fromStatus: null,
        toStatus: 'DETECTED',
        timestamp: new Date(),
        note: description
      }
    ]
  });

  await fault.save();
  await applyPriority(fault, streetlight);
  return fault;
};

const updateExistingFault = async (fault, streetlight) => {
  fault.occurrenceCount = (fault.occurrenceCount || 1) + 1;
  fault.lastDetectedAt = new Date();
  await fault.save();
  await applyPriority(fault, streetlight);
  return fault;
};

const analyzeTelemetry = async (streetlight, telemetry) => {
  const { lampState, signalStatus, current } = telemetry;
  const faultsCreated = [];
  const faultsUpdated = [];
  let newDeviceStatus = null;

  const hasDeviceOffline = signalStatus === 'OFFLINE';
  const hasLampFailure =
    streetlight.expectedLampState === 'ON' &&
    lampState === 'OFF' &&
    signalStatus === 'ONLINE' &&
    typeof current === 'number' &&
    current <= LAMP_FAILURE_CURRENT_THRESHOLD;

  const hasLowCurrent =
    streetlight.expectedLampState === 'ON' &&
    lampState === 'ON' &&
    signalStatus === 'ONLINE' &&
    typeof current === 'number' &&
    current < LOW_CURRENT_THRESHOLD &&
    current > LAMP_FAILURE_CURRENT_THRESHOLD;

  if (hasDeviceOffline) {
    const existingFault = await findUnresolvedFault(streetlight.streetlightId, 'DEVICE_OFFLINE');
    if (!existingFault) {
      const fault = await createFault(streetlight, 'DEVICE_OFFLINE', 'Device is offline');
      faultsCreated.push(fault);
    } else {
      const updated = await updateExistingFault(existingFault, streetlight);
      faultsUpdated.push(updated);
    }
    newDeviceStatus = 'OFFLINE';
  } else if (hasLampFailure) {
    const existingFault = await findUnresolvedFault(streetlight.streetlightId, 'LAMP_FAILURE');
    if (!existingFault) {
      const fault = await createFault(streetlight, 'LAMP_FAILURE', 'Lamp failure detected: expected ON but lamp is OFF with low current');
      faultsCreated.push(fault);
    } else {
      const updated = await updateExistingFault(existingFault, streetlight);
      faultsUpdated.push(updated);
    }
    newDeviceStatus = 'FAULT';
  } else if (hasLowCurrent) {
    const existingFault = await findUnresolvedFault(streetlight.streetlightId, 'LOW_CURRENT');
    if (!existingFault) {
      const fault = await createFault(streetlight, 'LOW_CURRENT', `Low current detected: ${current}A is below normal threshold`);
      faultsCreated.push(fault);
    } else {
      const updated = await updateExistingFault(existingFault, streetlight);
      faultsUpdated.push(updated);
    }
    newDeviceStatus = 'WARNING';
  } else {
    newDeviceStatus = 'ONLINE';
  }

  if (newDeviceStatus && streetlight.deviceStatus !== newDeviceStatus) {
    streetlight.deviceStatus = newDeviceStatus;
    await streetlight.save();
  }

  return { faultsCreated, faultsUpdated };
};

module.exports = {
  analyzeTelemetry,
  LAMP_FAILURE_CURRENT_THRESHOLD,
  LOW_CURRENT_THRESHOLD,
  applyPriority
};
