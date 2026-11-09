const Streetlight = require('../models/Streetlight');

const demoState = {
  operatingMode: 'NIGHT',
  simulatorRunning: true,
  scenarios: {
    'SL-001': null,
    'SL-002': null,
    'SL-003': null,
    'SL-004': null,
    'SL-005': null
  }
};

const supportedModes = new Set(['DAY', 'NIGHT']);
const supportedScenarioTypes = new Set(['LAMP_FAILURE', 'DEVICE_OFFLINE', 'LOW_CURRENT', 'NORMAL']);
const globalCommands = new Set(['RESET', 'START', 'STOP']);
const supportedScenarios = new Set([...supportedScenarioTypes, ...globalCommands]);
const legacyScenarioMap = {
  SL003_OFF: 'SL-003',
  SL004_OFFLINE: 'SL-004',
  SL005_LOW_CURRENT: 'SL-005'
};

const cloneState = () => ({
  operatingMode: demoState.operatingMode,
  simulatorRunning: demoState.simulatorRunning,
  scenarios: { ...demoState.scenarios }
});

const getState = () => cloneState();

const setMode = async (mode) => {
  const normalized = String(mode || '').toUpperCase();
  if (!supportedModes.has(normalized)) {
    throw new Error('Mode must be DAY or NIGHT');
  }

  demoState.operatingMode = normalized;

  const expectedLampState = normalized === 'DAY' ? 'OFF' : 'ON';
  const streetlights = await Streetlight.find();

  for (const streetlight of streetlights) {
    streetlight.expectedLampState = expectedLampState;
    await streetlight.save();
  }

  return {
    success: true,
    mode: normalized,
    expectedLampState,
    count: streetlights.length,
    state: getState()
  };
};

const normalizeScenario = (input) => {
  const normalized = String(input || '').toUpperCase();

  if (globalCommands.has(normalized)) {
    return normalized;
  }

  if (legacyScenarioMap[normalized]) {
    return { streetlightId: legacyScenarioMap[normalized], type: 'LAMP_FAILURE' };
  }

  const parts = normalized.split(':');
  if (parts.length === 2) {
    const [streetlightId, type] = parts;
    if (!supportedScenarioTypes.has(type)) {
      throw new Error('Unsupported scenario type');
    }
    return { streetlightId, type };
  }

  if (supportedScenarioTypes.has(normalized)) {
    return { streetlightId: null, type: normalized };
  }

  throw new Error('Unsupported scenario');
};

const applyScenario = async (input) => {
  const parsed = normalizeScenario(input);

  if (typeof parsed === 'string') {
    if (parsed === 'RESET') {
      for (const id of Object.keys(demoState.scenarios)) {
        demoState.scenarios[id] = null;
      }
      demoState.simulatorRunning = true;
      return {
        success: true,
        scenario: parsed,
        state: getState()
      };
    }

    if (parsed === 'START') {
      demoState.simulatorRunning = true;
      return {
        success: true,
        scenario: parsed,
        state: getState()
      };
    }

    if (parsed === 'STOP') {
      demoState.simulatorRunning = false;
      return {
        success: true,
        scenario: parsed,
        state: getState()
      };
    }
  }

  const { streetlightId, type } = parsed;

  if (streetlightId && !demoState.scenarios.hasOwnProperty(streetlightId)) {
    throw new Error('Unknown streetlight ID');
  }

  if (type === 'NORMAL') {
    const targetId = streetlightId || Object.keys(demoState.scenarios)[0];
    demoState.scenarios[targetId] = null;
  } else {
    const targetId = streetlightId || Object.keys(demoState.scenarios)[0];
    demoState.scenarios[targetId] = type;
  }

  return {
    success: true,
    scenario: streetlightId ? `${streetlightId}:${type}` : type,
    state: getState()
  };
};

module.exports = {
  demoState,
  getState,
  setMode,
  applyScenario,
  supportedModes,
  supportedScenarios
};
