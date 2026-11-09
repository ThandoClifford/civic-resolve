const LAMP_FAILURE_CURRENT_THRESHOLD = 0.05;
const LOW_CURRENT_THRESHOLD = 0.2;
const FALLBACK_COLOR = '#475569';
const FALLBACK_LABEL = 'UNKNOWN';

const DEVICE_STATUS_COLORS = {
  ONLINE: '#16a34a',
  WARNING: '#f59e0b',
  FAULT: '#dc2626',
  OFFLINE: '#475569'
};

export const getStreetlightDisplayInfo = (streetlight) => {
  const {
    expectedLampState = 'UNKNOWN',
    currentLampState = 'UNKNOWN',
    deviceStatus = 'UNKNOWN',
    current = null
  } = streetlight;

  if (deviceStatus === 'OFFLINE') {
    return { color: '#475569', label: 'DEVICE OFFLINE' };
  }

  if (
    expectedLampState === 'ON' &&
    currentLampState === 'OFF' &&
    typeof current === 'number' &&
    current <= LAMP_FAILURE_CURRENT_THRESHOLD
  ) {
    return { color: '#dc2626', label: 'LAMP FAILURE' };
  }

  if (
    expectedLampState === 'ON' &&
    currentLampState === 'ON' &&
    typeof current === 'number' &&
    current > LAMP_FAILURE_CURRENT_THRESHOLD &&
    current < LOW_CURRENT_THRESHOLD
  ) {
    return { color: '#f59e0b', label: 'LOW CURRENT' };
  }

  if (expectedLampState === 'OFF' && currentLampState === 'OFF') {
    return { color: '#7dd3fc', label: 'DAY MODE — NORMAL' };
  }

  if (
    expectedLampState === 'ON' &&
    currentLampState === 'ON' &&
    typeof current === 'number' &&
    current >= LOW_CURRENT_THRESHOLD
  ) {
    return { color: '#16a34a', label: 'NIGHT MODE — NORMAL' };
  }

  return {
    color: DEVICE_STATUS_COLORS[deviceStatus] || FALLBACK_COLOR,
    label: deviceStatus || FALLBACK_LABEL
  };
};
