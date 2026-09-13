const Streetlight = require('../models/Streetlight');

const demoState = {
  operatingMode: 'NIGHT',
  simulatorRunning: true,
  activeScenarios: {
    SL003_OFF: false,
    SL004_OFFLINE: false,
    SL005_LOW_CURRENT: false
  }
};

const supportedModes = new Set(['DAY', 'NIGHT']);
const supportedScenarios = new Set([
  'SL003_OFF',
  'SL004_OFFLINE',
  'SL005_LOW_CURRENT',
  'RESET',
  'START',
  'STOP'
]);

const cloneState = () => ({
  operatingMode: demoState.operatingMode,
  simulatorRunning: demoState.simulatorRunning,
  activeScenarios: { ...demoState.activeScenarios }
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

const applyScenario = async (scenario) => {
  const normalized = String(scenario || '').toUpperCase();
  if (!supportedScenarios.has(normalized)) {
    throw new Error('Unsupported scenario');
  }

  if (normalized === 'RESET') {
    demoState.activeScenarios = {
      SL003_OFF: false,
      SL004_OFFLINE: false,
      SL005_LOW_CURRENT: false
    };
    demoState.simulatorRunning = true;
    return {
      success: true,
      scenario: normalized,
      state: getState()
    };
  }

  if (normalized === 'START') {
    demoState.simulatorRunning = true;
    return {
      success: true,
      scenario: normalized,
      state: getState()
    };
  }

  if (normalized === 'STOP') {
    demoState.simulatorRunning = false;
    return {
      success: true,
      scenario: normalized,
      state: getState()
    };
  }

  demoState.activeScenarios[normalized] = true;
  return {
    success: true,
    scenario: normalized,
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
