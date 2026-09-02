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
let faultMode = {
  SL003_LAMP_OFF: false,
  SL004_DEVICE_OFFLINE: false,
  SL005_LOW_CURRENT: false
};

const randomVariation = (base, variance) => base + (Math.random() * variance * 2 - variance);

const generateReading = (streetlight) => {
  const isSL003 = streetlight.streetlightId === 'SL-003';
  const isSL004 = streetlight.streetlightId === 'SL-004';
  const isSL005 = streetlight.streetlightId === 'SL-005';

  let lampState = streetlight.expectedLampState;
  let signalStatus = 'ONLINE';
  let voltage = randomVariation(230, 5);
  let current = 0;

  if (isSL003 && faultMode.SL003_LAMP_OFF) {
    lampState = 'OFF';
    current = randomVariation(0.02, 0.01);
  } else if (isSL004 && faultMode.SL004_DEVICE_OFFLINE) {
    signalStatus = 'OFFLINE';
    lampState = streetlight.expectedLampState;
    voltage = randomVariation(230, 5);
    current = lampState === 'ON' ? randomVariation(0.5, 0.05) : 0;
  } else if (isSL005 && faultMode.SL005_LOW_CURRENT) {
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
  console.log('  - Type "SL003_OFF" to simulate SL-003 lamp failure (lamp OFF)');
  console.log('  - Type "SL004_OFFLINE" to simulate SL-004 device offline');
  console.log('  - Type "SL005_LOW_CURRENT" to simulate SL-005 low current');
  console.log('  - Type "RESET" to clear all fault modes');
  console.log('  - Type "STOP" to stop the simulator');
  console.log('  - Type "START" to resume the simulator');
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

      if (command === 'SL003_OFF') {
        faultMode.SL003_LAMP_OFF = !faultMode.SL003_LAMP_OFF;
        console.log(`SL-003 lamp fault simulation: ${faultMode.SL003_LAMP_OFF ? 'ENABLED' : 'DISABLED'}`);
      } else if (command === 'SL004_OFFLINE') {
        faultMode.SL004_DEVICE_OFFLINE = !faultMode.SL004_DEVICE_OFFLINE;
        console.log(`SL-004 device offline simulation: ${faultMode.SL004_DEVICE_OFFLINE ? 'ENABLED' : 'DISABLED'}`);
      } else if (command === 'SL005_LOW_CURRENT') {
        faultMode.SL005_LOW_CURRENT = !faultMode.SL005_LOW_CURRENT;
        console.log(`SL-005 low current simulation: ${faultMode.SL005_LOW_CURRENT ? 'ENABLED' : 'DISABLED'}`);
      } else if (command === 'RESET') {
        faultMode.SL003_LAMP_OFF = false;
        faultMode.SL004_DEVICE_OFFLINE = false;
        faultMode.SL005_LOW_CURRENT = false;
        console.log('All fault modes cleared');
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
      } else if (command) {
        console.log('Unknown command. Available: SL003_OFF, SL004_OFFLINE, SL005_LOW_CURRENT, RESET, STOP, START, EXIT');
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
  faultMode
};
