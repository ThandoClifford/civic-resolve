const Fault = require('../models/Fault');

const SEVERITY_SCORES = {
  LAMP_FAILURE: 40,
  DEVICE_OFFLINE: 30,
  LOW_CURRENT: 20,
  OTHER: 10
};

const LOCATION_SCORES = {
  PEDESTRIAN_CROSSING: 30,
  SCHOOL: 30,
  CLINIC: 25,
  TAXI_RANK: 25,
  MAIN_ROAD: 20,
  RESIDENTIAL: 10,
  OTHER: 5
};

const PERSISTENCE_SCORES = [
  { min: 1, max: 2, score: 3 },
  { min: 3, max: 5, score: 7 },
  { min: 6, max: 10, score: 11 },
  { min: 11, max: Infinity, score: 15 }
];

const DURATION_SCORES = [
  { max: 15 * 60 * 1000, score: 0 },
  { max: 59 * 60 * 1000, score: 5 },
  { max: 4 * 60 * 60 * 1000, score: 10 },
  { max: Infinity, score: 15 }
];

const PRIORITY_LEVELS = [
  { max: 29, level: 'LOW' },
  { max: 59, level: 'MEDIUM' },
  { max: 79, level: 'HIGH' },
  { max: 100, level: 'CRITICAL' }
];

const FAULT_SEVERITY_LABELS = {
  LAMP_FAILURE: 'complete lamp failure',
  DEVICE_OFFLINE: 'device offline',
  LOW_CURRENT: 'low current draw',
  OTHER: 'fault condition'
};

const INSTALLATION_LABELS = {
  PEDESTRIAN_CROSSING: 'pedestrian crossing',
  SCHOOL: 'school',
  CLINIC: 'clinic',
  TAXI_RANK: 'taxi rank',
  MAIN_ROAD: 'main road',
  RESIDENTIAL: 'residential area',
  OTHER: 'location'
};

const getSeverityScore = (faultType) => SEVERITY_SCORES[faultType] || SEVERITY_SCORES.OTHER;

const getLocationScore = (installationType) => LOCATION_SCORES[installationType] || LOCATION_SCORES.OTHER;

const getPersistenceScore = (occurrenceCount) => {
  const match = PERSISTENCE_SCORES.find((range) => occurrenceCount >= range.min && occurrenceCount <= range.max);
  return match ? match.score : 0;
};

const getDurationScore = (detectedAt) => {
  const now = new Date();
  const durationMs = now.getTime() - new Date(detectedAt).getTime();
  const match = DURATION_SCORES.find((range) => durationMs <= range.max);
  return match ? match.score : 0;
};

const getPriorityLevel = (score) => {
  const match = PRIORITY_LEVELS.find((range) => score <= range.max);
  return match ? match.level : 'LOW';
};

const buildExplanation = (fault, streetlight, scores) => {
  const severityLabel = FAULT_SEVERITY_LABELS[fault.faultType] || 'fault condition';
  const installationLabel = INSTALLATION_LABELS[streetlight.installationType] || 'location';
  const priorityLevel = getPriorityLevel(scores.total);

  const parts = [`${priorityLevel} priority because a ${severityLabel} was detected at a ${installationLabel}`];

  if (scores.persistence > 0) {
    parts.push('The fault has been detected repeatedly');
  }

  if (scores.duration >= 10) {
    parts.push('It has been unresolved for over 4 hours');
  } else if (scores.duration >= 5) {
    parts.push('It has been unresolved for between 15 minutes and 4 hours');
  }

  return parts.join('. ') + '.';
};

const calculatePriority = (fault, streetlight) => {
  const occurrenceCount = fault.occurrenceCount || 1;
  const severityScore = getSeverityScore(fault.faultType);
  const locationScore = getLocationScore(streetlight.installationType);
  const persistenceScore = getPersistenceScore(occurrenceCount);
  const durationScore = getDurationScore(fault.detectedAt);

  const total = Math.min(100, severityScore + locationScore + persistenceScore + durationScore);
  const priorityLevel = getPriorityLevel(total);

  const breakdown = {
    faultSeverity: severityScore,
    locationSensitivity: locationScore,
    persistence: persistenceScore,
    duration: durationScore
  };

  const explanation = buildExplanation(fault, streetlight, {
    total,
    ...breakdown
  });

  return {
    priorityScore: total,
    priorityLevel,
    priorityBreakdown: breakdown,
    priorityExplanation: explanation,
    priorityCalculatedAt: new Date()
  };
};

module.exports = {
  calculatePriority,
  getSeverityScore,
  getLocationScore,
  getPersistenceScore,
  getDurationScore,
  getPriorityLevel,
  buildExplanation
};
