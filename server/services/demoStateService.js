const Streetlight = require('../models/Streetlight');
const http = require('http');

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

const LAMP_FAILURE_CURRENT_THRESHOLD = 0.05;
const LOW_CURRENT_THRESHOLD = 0.2;

const API_BASE_URL = 'http://localhost:5000';

let telemetryInterval = null;

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

const generateScenarioReading = (streetlightId, scenario, expectedLampState) => {
  let lampState = expectedLampState;
  let signalStatus = 'ONLINE';
  let voltage = 230 + (Math.random() * 10 - 5);
  let current = 0;

  if (scenario === 'LAMP_FAILURE') {
    lampState = 'OFF';
    current = 0.02 + (Math.random() * 0.02 - 0.01);
  } else if (scenario === 'DEVICE_OFFLINE') {
    signalStatus = 'OFFLINE';
    lampState = expectedLampState;
    voltage = 230 + (Math.random() * 10 - 5);
    current = lampState === 'ON' ? 0.5 + (Math.random() * 0.1 - 0.05) : 0;
  } else if (scenario === 'LOW_CURRENT') {
    lampState = 'ON';
    signalStatus = 'ONLINE';
    voltage = 230 + (Math.random() * 10 - 5);
    current = 0.12 + (Math.random() * 0.04 - 0.02);
  } else {
    lampState = expectedLampState;
    if (lampState === 'ON') {
      voltage = 230 + (Math.random() * 10 - 5);
      current = 0.5 + (Math.random() * 0.1 - 0.05);
    } else {
      voltage = 230 + (Math.random() * 10 - 5);
      current = 0.02 + (Math.random() * 0.02 - 0.01);
    }
  }

  return {
    streetlightId,
    lampState,
    voltage: Math.round(voltage * 100) / 100,
    current: Math.round(current * 100) / 100,
    signalStatus
  };
};

const sendTelemetry = (reading) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      ...reading,
      timestamp: new Date().toISOString()
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/telemetry',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-api-key': process.env.DEVICE_API_KEY || ''
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve({ status: res.statusCode, body: data }); });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

const generateScenarioTelemetry = async () => {
  if (!demoState.simulatorRunning) {
    return;
  }

  try {
    const streetlights = await Streetlight.find();

    for (const streetlight of streetlights) {
      const scenario = demoState.scenarios[streetlight.streetlightId] || null;
      const reading = generateScenarioReading(streetlight.streetlightId, scenario, streetlight.expectedLampState);
      await sendTelemetry(reading);
    }
  } catch (error) {
    console.error('[Simulator] Telemetry generation error:', error.message);
  }
};

const startTelemetryGeneration = () => {
  if (telemetryInterval) {
    return;
  }
  telemetryInterval = setInterval(generateScenarioTelemetry, 5000);
  generateScenarioTelemetry();
};

const stopTelemetryGeneration = () => {
  if (telemetryInterval) {
    clearInterval(telemetryInterval);
    telemetryInterval = null;
  }
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
    if (globalCommands.has(streetlightId)) {
      return streetlightId;
    }
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
      startTelemetryGeneration();
      return {
        success: true,
        scenario: parsed,
        state: getState()
      };
    }

    if (parsed === 'START') {
      demoState.simulatorRunning = true;
      startTelemetryGeneration();
      return {
        success: true,
        scenario: parsed,
        state: getState()
      };
    }

    if (parsed === 'STOP') {
      demoState.simulatorRunning = false;
      stopTelemetryGeneration();
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

  startTelemetryGeneration();

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
  startTelemetryGeneration,
  stopTelemetryGeneration,
  supportedModes,
  supportedScenarios
};
