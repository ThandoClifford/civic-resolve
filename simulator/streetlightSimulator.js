const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

const API_URL = process.env.API_URL || 'http://localhost:5000';
const DEVICE_API_KEY = process.env.DEVICE_API_KEY || '';
const TELEMETRY_INTERVAL_MS = parseInt(process.env.TELEMETRY_INTERVAL_MS, 10) || 5000;

const STREETLIGHTS = [
  { streetlightId: 'SL-001', name: 'Campus Entrance', expectedLampState: 'ON' },
  { streetlightId: 'SL-002', name: 'Main Road', expectedLampState: 'ON' },
  { streetlightId: 'SL-003', name: 'Pedestrian Crossing', expectedLampState: 'ON' },
  { streetlightId: 'SL-004', name: 'Residential Street', expectedLampState: 'ON' },
  { streetlightId: 'SL-005', name: 'Taxi Rank', expectedLampState: 'ON' }
];

let simulationActive = true;
let streetlightScenarios = {};

const randomVariation = (base, variance) => base + (Math.random() * variance * 2 - variance);

const syncDemoStateFromServer = async () => {
  if (!DEVICE_API_KEY) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/demo/state`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-device-api-key': DEVICE_API_KEY
      }
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const scenarios = payload?.state?.scenarios || {};
    const operatingMode = String(payload?.state?.operatingMode || 'NIGHT').toUpperCase();
    const expectedLampState = operatingMode === 'DAY' ? 'OFF' : 'ON';

    streetlightScenarios = { ...scenarios };
    simulationActive = payload?.state?.simulatorRunning !== false;

    STREETLIGHTS.forEach((streetlight) => {
      streetlight.expectedLampState = expectedLampState;
    });
  } catch (error) {
    console.log(`[Simulator] Demo state sync warning: ${error.message}`);
  }
};

const generateReading = (streetlight) => {
  const scenario = streetlightScenarios[streetlight.streetlightId] || null;

  let lampState = streetlight.expectedLampState;
  let signalStatus = 'ONLINE';
  let voltage = randomVariation(230, 5);
  let current = 0;

  if (scenario === 'LAMP_FAILURE') {
    lampState = 'OFF';
    current = randomVariation(0.02, 0.01);
  } else if (scenario === 'DEVICE_OFFLINE') {
    signalStatus = 'OFFLINE';
    lampState = streetlight.expectedLampState;
    voltage = randomVariation(230, 5);
    current = lampState === 'ON' ? randomVariation(0.5, 0.05) : 0;
  } else if (scenario === 'LOW_CURRENT') {
    lampState = 'ON';
    signalStatus = 'ONLINE';
    voltage = randomVariation(230, 5);
    current = randomVariation(0.12, 0.02);
  } else {
    lampState = streetlight.expectedLampState;
    if (lampState === 'ON') {
      voltage = randomVariation(230, 5);
      current = randomVariation(0.5, 0.05);
    } else {
      voltage = randomVariation(230, 5);
      current = randomVariation(0.02, 0.01);
    }
  }

  return {
    streetlightId: streetlight.streetlightId,
    lampState,
    voltage: Math.round(voltage * 100) / 100,
    current: Math.round(current * 100) / 100,
    signalStatus
  };
};

const sendTelemetry = async (reading) => {
  const payload = {
    ...reading,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(`${API_URL}/api/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-api-key': DEVICE_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.log(`[${reading.streetlightId}] ERROR: ${result.message}`);
      return;
    }

    console.log(
      `[${reading.streetlightId}] ${reading.signalStatus} | Lamp ${reading.lampState} | ${reading.voltage}V | ${reading.current}A`
    );
  } catch (error) {
    console.log(`[${reading.streetlightId}] NETWORK ERROR: ${error.message}`);
  }
};

const runSimulationCycle = async () => {
  await syncDemoStateFromServer();

  if (!simulationActive) {
    return;
  }

  const promises = STREETLIGHTS.map((streetlight) => {
    const reading = generateReading(streetlight);
    return sendTelemetry(reading);
  });

  await Promise.all(promises);
};

const startSimulation = () => {
  console.log('CivicResolve SmartLight Simulator');
  console.log(`API URL: ${API_URL}`);
  console.log(`Interval: ${TELEMETRY_INTERVAL_MS}ms`);
  console.log('Streetlights:', STREETLIGHTS.map((s) => s.streetlightId).join(', '));
  console.log('\nAvailable fault simulations:');
  console.log('  - Type "SL-001:LAMP_FAILURE" to simulate lamp failure');
  console.log('  - Type "SL-002:DEVICE_OFFLINE" to simulate device offline');
  console.log('  - Type "SL-003:LOW_CURRENT" to simulate low current');
  console.log('  - Type "RESET" to clear all scenarios');
  console.log('  - Type "STOP" to stop the simulator');
  console.log('  - Type "START" to resume the simulator');
  console.log('  - Type "EXIT" to quit');
  console.log('');

  const intervalId = setInterval(runSimulationCycle, TELEMETRY_INTERVAL_MS);
  runSimulationCycle();

  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });

  const prompt = () => {
    rl.question('simulator> ', (input) => {
      const command = input.trim().toUpperCase();

      if (command === 'RESET') {
        streetlightScenarios = {};
        console.log('All scenarios cleared');
      } else if (command === 'STOP') {
        simulationActive = false;
        console.log('Simulator paused');
      } else if (command === 'START') {
        simulationActive = true;
        console.log('Simulator resumed');
      } else if (command === 'EXIT') {
        simulationActive = false;
        clearInterval(intervalId);
        rl.close();
        console.log('Simulator stopped');
        process.exit(0);
      } else if (command.includes(':')) {
        const [streetlightId, scenarioType] = command.split(':');
        const current = streetlightScenarios[streetlightId];
        if (current === scenarioType) {
          streetlightScenarios[streetlightId] = null;
          console.log(`${streetlightId} ${scenarioType} simulation: DISABLED`);
        } else {
          streetlightScenarios[streetlightId] = scenarioType;
          console.log(`${streetlightId} ${scenarioType} simulation: ENABLED`);
        }
      } else if (command) {
        console.log('Unknown command. Available: SL-001:LAMP_FAILURE, SL-002:DEVICE_OFFLINE, SL-003:LOW_CURRENT, RESET, STOP, START, EXIT');
      }

      prompt();
    });
  };

  prompt();
};

if (require.main === module) {
  if (!DEVICE_API_KEY) {
    console.error('DEVICE_API_KEY environment variable is required');
    process.exit(1);
  }

  startSimulation();
}

module.exports = {
  STREETLIGHTS,
  generateReading,
  sendTelemetry,
  runSimulationCycle,
  startSimulation,
  streetlightScenarios
};
