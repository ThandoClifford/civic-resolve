const PRIORITY_THRESHOLDS = {
  LOW: { min: 0, max: 29 },
  MEDIUM: { min: 30, max: 59 },
  HIGH: { min: 60, max: 79 },
  CRITICAL: { min: 80, max: 100 }
};

const FACTOR_MAX_POINTS = {
  safetyRisk: 30,
  environmentalImpact: 20,
  peopleAffected: 20,
  locationSensitivity: 15,
  issueAge: 15
};

const SAFETY_RISK_POINTS = {
  none: 0,
  low: 8,
  medium: 16,
  high: 24,
  critical: 30
};

const ENVIRONMENTAL_IMPACT_POINTS = {
  none: 0,
  low: 7,
  medium: 14,
  high: 20
};

const LOCATION_SENSITIVITY_POINTS = {
  normal_residential: 0,
  business_commercial: 4,
  public_transport_area: 7,
  high_density_public_area: 10,
  school: 12,
  hospital: 15
};

const LOCATION_SENSITIVITY_LABELS = {
  normal_residential: 'normal residential area',
  business_commercial: 'business/commercial area',
  public_transport_area: 'public transport area',
  high_density_public_area: 'high-density public area',
  school: 'school',
  hospital: 'hospital'
};

const VALID_SAFETY_RISKS = Object.keys(SAFETY_RISK_POINTS);
const VALID_ENVIRONMENTAL_IMPACTS = Object.keys(ENVIRONMENTAL_IMPACT_POINTS);
const VALID_LOCATION_SENSITIVITIES = Object.keys(LOCATION_SENSITIVITY_POINTS);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeKey = (value) => String(value || '').trim().toLowerCase().replace(/[\s\-\/]+/g, '_');

const normalizeLocationSensitivity = (value) => {
  const normalized = normalizeKey(value);

  const aliases = {
    normal: 'normal_residential',
    residential: 'normal_residential',
    normal_residential_area: 'normal_residential',
    business: 'business_commercial',
    commercial: 'business_commercial',
    business_commercial_area: 'business_commercial',
    public_transport: 'public_transport_area',
    transport: 'public_transport_area',
    public_transport_area: 'public_transport_area',
    high_density_public: 'high_density_public_area',
    high_density_public_area: 'high_density_public_area'
  };

  return aliases[normalized] || normalized;
};

const scoreSafetyRisk = (value) => SAFETY_RISK_POINTS[normalizeKey(value)] ?? 0;
const scoreEnvironmentalImpact = (value) => ENVIRONMENTAL_IMPACT_POINTS[normalizeKey(value)] ?? 0;

const scorePeopleAffected = (value) => {
  const affected = Number(value);

  if (!Number.isFinite(affected) || affected <= 0) {
    return 0;
  }

  if (affected <= 10) {
    return 3;
  }

  if (affected <= 50) {
    return 7;
  }

  if (affected <= 100) {
    return 11;
  }

  if (affected <= 500) {
    return 16;
  }

  return 20;
};

const scoreLocationSensitivity = (value) => {
  const normalized = normalizeLocationSensitivity(value);
  return LOCATION_SENSITIVITY_POINTS[normalized] ?? 0;
};

const scoreIssueAge = (createdAt, status, now = new Date()) => {
  if (status === 'resolved') {
    return 0;
  }

  const created = createdAt ? new Date(createdAt) : null;

  if (!created || Number.isNaN(created.getTime())) {
    return 0;
  }

  const ageInDays = Math.max(0, Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));

  if (ageInDays <= 1) {
    return 0;
  }

  if (ageInDays <= 3) {
    return 2;
  }

  if (ageInDays <= 7) {
    return 5;
  }

  if (ageInDays <= 14) {
    return 9;
  }

  if (ageInDays <= 30) {
    return 12;
  }

  return 15;
};

const getPriorityLevel = (score) => {
  if (score >= PRIORITY_THRESHOLDS.CRITICAL.min) {
    return 'CRITICAL';
  }

  if (score >= PRIORITY_THRESHOLDS.HIGH.min) {
    return 'HIGH';
  }

  if (score >= PRIORITY_THRESHOLDS.MEDIUM.min) {
    return 'MEDIUM';
  }

  return 'LOW';
};

const explainSafetyRisk = (value) => {
  const normalized = normalizeKey(value);
  const labels = {
    none: 'no safety risk',
    low: 'low safety risk',
    medium: 'moderate safety risk',
    high: 'high safety risk',
    critical: 'critical safety risk'
  };

  return labels[normalized] || 'unspecified safety risk';
};

const explainEnvironmentalImpact = (value) => {
  const normalized = normalizeKey(value);
  const labels = {
    none: 'no environmental impact',
    low: 'low environmental impact',
    medium: 'moderate environmental impact',
    high: 'high environmental impact'
  };

  return labels[normalized] || 'unspecified environmental impact';
};

const explainLocationSensitivity = (value) => {
  const normalized = normalizeLocationSensitivity(value);
  return LOCATION_SENSITIVITY_LABELS[normalized] || 'unspecified location sensitivity';
};

const buildPriorityExplanation = ({ level, breakdown }) => {
  const reasons = [];

  if (breakdown.safetyRisk.points > 0) {
    reasons.push(explainSafetyRisk(breakdown.safetyRisk.value));
  }

  if (breakdown.environmentalImpact.points > 0) {
    reasons.push(explainEnvironmentalImpact(breakdown.environmentalImpact.value));
  }

  if (breakdown.peopleAffected.points > 0) {
    reasons.push(`affects approximately ${breakdown.peopleAffected.value} people`);
  }

  if (breakdown.locationSensitivity.points > 0) {
    reasons.push(`is located near a ${explainLocationSensitivity(breakdown.locationSensitivity.value)}`);
  }

  if (breakdown.issueAge.points > 0) {
    reasons.push(`has remained unresolved for ${breakdown.issueAge.days} day${breakdown.issueAge.days === 1 ? '' : 's'}`);
  }

  if (reasons.length === 0) {
    return `This issue received a ${level} priority because the reported factors indicate limited immediate impact.`;
  }

  if (reasons.length === 1) {
    return `This issue received a ${level} priority because it ${reasons[0]}.`;
  }

  const lastReason = reasons.pop();
  return `This issue received a ${level} priority because it ${reasons.join(', ')}, and ${lastReason}.`;
};

const calculatePriority = (complaint, now = new Date()) => {
  const safetyRisk = normalizeKey(complaint.safetyRisk || 'none');
  const environmentalImpact = normalizeKey(complaint.environmentalImpact || 'none');
  const locationSensitivity = normalizeLocationSensitivity(complaint.locationSensitivity || 'normal_residential');
  const peopleAffected = Number.isFinite(Number(complaint.peopleAffected)) ? Number(complaint.peopleAffected) : 0;
  const createdAtDate = complaint.createdAt ? new Date(complaint.createdAt) : now;
  const issueAgeDays = Number.isNaN(createdAtDate.getTime())
    ? 0
    : Math.max(0, Math.floor((now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24)));

  const breakdown = {
    safetyRisk: {
      value: safetyRisk,
      points: scoreSafetyRisk(safetyRisk),
      maxPoints: FACTOR_MAX_POINTS.safetyRisk
    },
    environmentalImpact: {
      value: environmentalImpact,
      points: scoreEnvironmentalImpact(environmentalImpact),
      maxPoints: FACTOR_MAX_POINTS.environmentalImpact
    },
    peopleAffected: {
      value: peopleAffected,
      points: scorePeopleAffected(peopleAffected),
      maxPoints: FACTOR_MAX_POINTS.peopleAffected
    },
    locationSensitivity: {
      value: locationSensitivity,
      points: scoreLocationSensitivity(locationSensitivity),
      maxPoints: FACTOR_MAX_POINTS.locationSensitivity
    },
    issueAge: {
      days: issueAgeDays,
      points: scoreIssueAge(complaint.createdAt, complaint.status, now),
      maxPoints: FACTOR_MAX_POINTS.issueAge
    }
  };

  const totalPoints = clamp(
    breakdown.safetyRisk.points +
      breakdown.environmentalImpact.points +
      breakdown.peopleAffected.points +
      breakdown.locationSensitivity.points +
      breakdown.issueAge.points,
    0,
    100
  );

  const priorityLevel = getPriorityLevel(totalPoints);

  return {
    priorityScore: totalPoints,
    priorityLevel,
    priorityBreakdown: breakdown,
    priorityExplanation: buildPriorityExplanation({ level: priorityLevel, breakdown }),
    priorityCalculatedAt: now
  };
};

const validatePriorityInputs = (payload = {}) => {
  const errors = [];

  if (payload.peopleAffected !== undefined) {
    const affected = Number(payload.peopleAffected);
    if (!Number.isFinite(affected) || affected < 0) {
      errors.push('peopleAffected must be greater than or equal to 0');
    }
  }

  if (payload.safetyRisk !== undefined && !VALID_SAFETY_RISKS.includes(normalizeKey(payload.safetyRisk))) {
    errors.push('safetyRisk must be one of: none, low, medium, high, critical');
  }

  if (payload.environmentalImpact !== undefined && !VALID_ENVIRONMENTAL_IMPACTS.includes(normalizeKey(payload.environmentalImpact))) {
    errors.push('environmentalImpact must be one of: none, low, medium, high');
  }

  if (payload.locationSensitivity !== undefined && !VALID_LOCATION_SENSITIVITIES.includes(normalizeLocationSensitivity(payload.locationSensitivity))) {
    errors.push('locationSensitivity must be one of: normal_residential, business_commercial, public_transport_area, high_density_public_area, school, hospital');
  }

  return errors;
};

module.exports = {
  PRIORITY_THRESHOLDS,
  FACTOR_MAX_POINTS,
  VALID_SAFETY_RISKS,
  VALID_ENVIRONMENTAL_IMPACTS,
  VALID_LOCATION_SENSITIVITIES,
  normalizeLocationSensitivity,
  calculatePriority,
  validatePriorityInputs
};