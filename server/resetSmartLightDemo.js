const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Streetlight = require('./models/Streetlight');
const Telemetry = require('./models/Telemetry');
const Fault = require('./models/Fault');

dotenv.config();

const resetSmartLightDemo = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/municipal_complaints');
    console.log('MongoDB connected');

    await Telemetry.deleteMany({});
    console.log('Cleared telemetry data');

    await Fault.deleteMany({});
    console.log('Cleared fault data');

    await Streetlight.deleteMany({});
    console.log('Cleared streetlights');

    const streetlights = [
      {
        streetlightId: 'SL-001',
        name: 'Main Entrance',
        location: {
          areaName: 'Demo Campus - Main Gate',
          coordinates: {
            latitude: -26.1850,
            longitude: 28.0030
          }
        },
        installationType: 'SCHOOL',
        expectedLampState: 'ON',
        currentLampState: 'ON',
        deviceStatus: 'ONLINE',
        voltage: 220,
        current: 0.5,
        lastSeen: new Date('2025-04-29T21:00:00'),
        installedAt: new Date('2023-06-15'),
        isActive: true
      },
      {
        streetlightId: 'SL-002',
        name: 'Main Road',
        location: {
          areaName: 'Demo Campus - Main Road',
          coordinates: {
            latitude: -26.1855,
            longitude: 28.0038
          }
        },
        installationType: 'MAIN_ROAD',
        expectedLampState: 'ON',
        currentLampState: 'ON',
        deviceStatus: 'ONLINE',
        voltage: 220,
        current: 0.6,
        lastSeen: new Date('2025-04-29T21:00:00'),
        installedAt: new Date('2022-11-20'),
        isActive: true
      },
      {
        streetlightId: 'SL-003',
        name: 'Pedestrian Crossing',
        location: {
          areaName: 'Demo Campus - Pedestrian Crossing',
          coordinates: {
            latitude: -26.1862,
            longitude: 28.0045
          }
        },
        installationType: 'PEDESTRIAN_CROSSING',
        expectedLampState: 'ON',
        currentLampState: 'UNKNOWN',
        deviceStatus: 'WARNING',
        voltage: 215,
        current: 0.4,
        lastSeen: new Date('2025-04-29T19:30:00'),
        installedAt: new Date('2024-02-10'),
        isActive: true
      },
      {
        streetlightId: 'SL-004',
        name: 'Residential Street',
        location: {
          areaName: 'Demo Campus - Residential Side Street',
          coordinates: {
            latitude: -26.1868,
            longitude: 28.0052
          }
        },
        installationType: 'RESIDENTIAL',
        expectedLampState: 'ON',
        currentLampState: 'OFF',
        deviceStatus: 'FAULT',
        voltage: 210,
        current: 0.1,
        lastSeen: new Date('2025-04-29T18:45:00'),
        installedAt: new Date('2023-09-05'),
        isActive: true
      },
      {
        streetlightId: 'SL-005',
        name: 'Taxi Rank',
        location: {
          areaName: 'Demo Campus - Transport/Taxi Area',
          coordinates: {
            latitude: -26.1874,
            longitude: 28.0060
          }
        },
        installationType: 'TAXI_RANK',
        expectedLampState: 'ON',
        currentLampState: 'ON',
        deviceStatus: 'ONLINE',
        voltage: 220,
        current: 0.55,
        lastSeen: new Date('2025-04-29T21:00:00'),
        installedAt: new Date('2024-05-18'),
        isActive: true
      }
    ];

    await Streetlight.insertMany(streetlights);
    console.log(`Successfully seeded ${streetlights.length} streetlights`);
    console.log('\nSmartLight demo reset complete.');
    console.log('NOTE: Streetlight coordinates are prototype/demo locations clustered around a simulated campus area.');
    console.log('Users, complaints, and other data were NOT modified.\n');

    process.exit(0);
  } catch (error) {
    console.error('Reset error:', error);
    process.exit(1);
  }
};

resetSmartLightDemo();
