const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Complaint = require('./models/Complaint');
const Streetlight = require('./models/Streetlight');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/municipal_complaints');
    console.log('MongoDB connected');

    await Complaint.deleteMany({});
    console.log('Cleared existing complaints');

    const complaints = [
      // Complaint 1 - High priority with multiple updates and images
      {
        title: 'Illegal dumping behind grocery store',
        description: 'Large pile of trash and construction debris dumped behind the local grocery store on Main Street. Need immediate cleanup.',
        category: 'Illegal Dumping',
        priority: 'high',
        status: 'in_progress',
        location: {
          areaName: 'Downtown District',
          coordinates: {
            latitude: 40.7128,
            longitude: -74.006
          }
        },
        assignedTeam: {
          name: 'Sanitation Unit A',
          members: ['John D.', 'Maria S.']
        },
        images: [
          {
            url: 'https://images.example.org/dumping1.jpg',
            uploadedAt: new Date('2025-04-15')
          },
          {
            url: 'https://images.example.org/dumping2.jpg',
            uploadedAt: new Date('2025-04-15')
          }
        ],
        updates: [
          {
            status: 'pending',
            comment: 'Initial report received',
            updatedAt: new Date('2025-04-15T09:00:00')
          },
          {
            status: 'under_review',
            comment: 'Dispatch team assigned for investigation',
            updatedAt: new Date('2025-04-15T10:30:00')
          },
          {
            status: 'in_progress',
            comment: 'Cleanup crew dispatched to location',
            updatedAt: new Date('2025-04-15T14:00:00')
          }
        ],
        createdAt: new Date('2025-04-15T08:30:00'),
        updatedAt: new Date('2025-04-15T14:00:00')
      },

      // Complaint 2 - Medium priority with one update
      {
        title: 'Illegal dumping in alleyway',
        description: 'Furniture and household items dumped in the alley between 5th and 6th Avenue.',
        category: 'Illegal Dumping',
        priority: 'medium',
        status: 'under_review',
        location: {
          areaName: 'West Side',
          coordinates: {
            latitude: 40.7150,
            longitude: -74.010
          }
        },
        assignedTeam: {
          name: 'Sanitation Unit B',
          members: ['Carlos M.', 'Linda P.']
        },
        images: [
          {
            url: 'https://images.example.org/alley1.jpg',
            uploadedAt: new Date('2025-04-20')
          }
        ],
        updates: [
          {
            status: 'pending',
            comment: 'Report submitted via mobile app',
            updatedAt: new Date('2025-04-20T11:00:00')
          },
          {
            status: 'under_review',
            comment: 'Team dispatched to assess situation',
            updatedAt: new Date('2025-04-20T13:00:00')
          }
        ],
        createdAt: new Date('2025-04-20T10:45:00'),
        updatedAt: new Date('2025-04-20T13:00:00')
      },

      // Complaint 3 - Water leak, high priority
      {
        title: 'Water leak on corner causing flooding',
        description: 'Water leaking from a broken pipe on the corner of Oak and Elm streets. Water is flooding the sidewalk.',
        category: 'Water Leak',
        priority: 'high',
        status: 'in_progress',
        location: {
          areaName: 'Oakland Neighborhood',
          coordinates: {
            latitude: 40.7200,
            longitude: -74.015
          }
        },
        assignedTeam: {
          name: 'Water & Sewer Dept',
          members: ['Mike W.', 'Sarah K.']
        },
        images: [
          {
            url: 'https://images.example.org/leak1.jpg',
            uploadedAt: new Date('2025-04-18')
          },
          {
            url: 'https://images.example.org/leak2.jpg',
            uploadedAt: new Date('2025-04-18')
          },
          {
            url: 'https://images.example.org/leak3.jpg',
            uploadedAt: new Date('2025-04-18')
          }
        ],
        updates: [
          {
            status: 'pending',
            comment: 'Citizen reported major water leak',
            updatedAt: new Date('2025-04-18T07:00:00')
          },
          {
            status: 'in_progress',
            comment: 'Emergency repair team en route',
            updatedAt: new Date('2025-04-18T07:45:00')
          }
        ],
        createdAt: new Date('2025-04-18T06:55:00'),
        updatedAt: new Date('2025-04-18T07:45:00')
      },

      // Complaint 4 - Road damage, medium
      {
        title: 'Large pothole on highway exit',
        description: 'Large pothole causing damage to vehicles on the highway exit ramp. Multiple complaints received.',
        category: 'Road Damage',
        priority: 'medium',
        status: 'pending',
        location: {
          areaName: 'Highway 95 Corridor',
          coordinates: {
            latitude: 40.7080,
            longitude: -74.020
          }
        },
        assignedTeam: {
          name: 'Road Maintenance',
          members: ['Tom B.', 'Rachel G.']
        },
        images: [
          {
            url: 'https://images.example.org/pothole1.jpg',
            uploadedAt: new Date('2025-04-22')
          }
        ],
        updates: [
          {
            status: 'pending',
            comment: 'Multiple reports filed about this pothole',
            updatedAt: new Date('2025-04-22T16:00:00')
          }
        ],
        createdAt: new Date('2025-04-22T15:50:00'),
        updatedAt: new Date('2025-04-22T16:00:00')
      },

      // Complaint 5 - Electricity fault, low priority, resolved
      {
        title: 'Street light out in residential area',
        description: 'Street light not working in residential area causing safety concerns for pedestrians.',
        category: 'Electricity Fault',
        priority: 'low',
        status: 'resolved',
        location: {
          areaName: 'Pine Street Residential',
          coordinates: {
            latitude: 40.7100,
            longitude: -74.008
          }
        },
        assignedTeam: {
          name: 'Electric Utilities',
          members: ['David L.']
        },
        images: [
          {
            url: 'https://images.example.org/streetlight1.jpg',
            uploadedAt: new Date('2025-04-10')
          }
        ],
        updates: [
          {
            status: 'pending',
            comment: 'Report received about malfunctioning streetlight',
            updatedAt: new Date('2025-04-10T20:00:00')
          },
          {
            status: 'under_review',
            comment: 'Electrician assigned to investigate',
            updatedAt: new Date('2025-04-11T08:00:00')
          },
          {
            status: 'in_progress',
            comment: 'Bulb replaced, light functioning again',
            updatedAt: new Date('2025-04-11T12:00:00')
          },
          {
            status: 'resolved',
            comment: 'Issue confirmed resolved',
            updatedAt: new Date('2025-04-11T14:00:00')
          }
        ],
        createdAt: new Date('2025-04-10T19:55:00'),
        updatedAt: new Date('2025-04-11T14:00:00')
      },

      // Complaint 6 - Another illegal dumping
      {
        title: 'Multiple illegal dumping reports near park',
        description: 'Several bags of garbage dumped near the park entrance. Looks like household waste.',
        category: 'Illegal Dumping',
        priority: 'medium',
        status: 'pending',
        location: {
          areaName: 'Central Park Entrance',
          coordinates: {
            latitude: 40.7130,
            longitude: -74.007
          }
        },
        assignedTeam: {
          name: '',
          members: []
        },
        images: [],
        updates: [
          {
            status: 'pending',
            comment: 'Initial report logged',
            updatedAt: new Date('2025-04-25T10:00:00')
          }
        ],
        createdAt: new Date('2025-04-25T09:45:00'),
        updatedAt: new Date('2025-04-25T10:00:00')
      },

      // Complaint 7 - Illegal dumping riverside
      {
        title: 'Old appliances dumped near river bank',
        description: 'Discarded washing machines and refrigerators dumped near the river bank. Environmental hazard.',
        category: 'Illegal Dumping',
        priority: 'high',
        status: 'pending',
        location: {
          areaName: 'Riverside Industrial',
          coordinates: {
            latitude: 40.7135,
            longitude: -74.005
          }
        },
        assignedTeam: {
          name: 'Environmental Task Force',
          members: ['Alex R.', 'Jordan T.']
        },
        images: [
          {
            url: 'https://images.example.org/appliances1.jpg',
            uploadedAt: new Date('2025-04-26')
          }
        ],
        updates: [
          {
            status: 'pending',
            comment: 'Reported by concerned citizen during walk',
            updatedAt: new Date('2025-04-26T08:00:00')
          }
        ],
        createdAt: new Date('2025-04-26T07:50:00'),
        updatedAt: new Date('2025-04-26T08:00:00')
      },

      // Complaint 8 - Illegal dumping empty lot
      {
        title: 'Construction debris in empty lot',
        description: 'Empty lot on 8th Street being used for illegal dumping of construction materials.',
        category: 'Illegal Dumping',
        priority: 'medium',
        status: 'pending',
        location: {
          areaName: '8th Street Corridor',
          coordinates: {
            latitude: 40.7125,
            longitude: -74.008
          }
        },
        assignedTeam: {
          name: '',
          members: []
        },
        images: [],
        updates: [],
        createdAt: new Date('2025-04-27T11:00:00'),
        updatedAt: new Date('2025-04-27T11:00:00')
      },

      // Complaint 9 - Illegal dumping near school
      {
        title: 'Dumping near elementary school playground',
        description: 'Trash dumped dangerously close to elementary school playground. Health risk for children.',
        category: 'Illegal Dumping',
        priority: 'high',
        status: 'under_review',
        location: {
          areaName: 'School District',
          coordinates: {
            latitude: 40.7140,
            longitude: -74.004
          }
        },
        assignedTeam: {
          name: 'Crisis Response',
          members: ['Officer Miller', 'Clean Team 5']
        },
        images: [
          {
            url: 'https://images.example.org/school1.jpg',
            uploadedAt: new Date('2025-04-28')
          },
          {
            url: 'https://images.example.org/school2.jpg',
            uploadedAt: new Date('2025-04-28')
          }
        ],
        updates: [
          {
            status: 'pending',
            comment: 'Urgent report from school staff',
            updatedAt: new Date('2025-04-28T07:30:00')
          },
          {
            status: 'under_review',
            comment: 'Escalated to priority response team',
            updatedAt: new Date('2025-04-28T08:00:00')
          }
        ],
        createdAt: new Date('2025-04-28T07:25:00'),
        updatedAt: new Date('2025-04-28T08:00:00')
      },

      // Complaint 10 - Water Leak, resolved
      {
        title: 'Sewage leak in residential area',
        description: 'Sewage pipe burst causing contamination in neighborhood. Health hazard.',
        category: 'Water Leak',
        priority: 'high',
        status: 'resolved',
        location: {
          areaName: 'North Heights',
          coordinates: {
            latitude: 40.7180,
            longitude: -74.012
          }
        },
        assignedTeam: {
          name: 'Emergency Sewer Crew',
          members: ['Robert F.', 'Emergency Unit']
        },
        images: [
          {
            url: 'https://images.example.org/sewer1.jpg',
            uploadedAt: new Date('2025-04-05')
          }
        ],
        updates: [
          {
            status: 'pending',
            comment: 'Emergency call received',
            updatedAt: new Date('2025-04-05T06:00:00')
          },
          {
            status: 'in_progress',
            comment: 'Crew on site, containment in progress',
            updatedAt: new Date('2025-04-05T07:00:00')
          },
          {
            status: 'resolved',
            comment: 'Repair completed, area sanitized',
            updatedAt: new Date('2025-04-05T16:00:00')
          }
        ],
        createdAt: new Date('2025-04-05T05:55:00'),
        updatedAt: new Date('2025-04-05T16:00:00')
      },

      // Complaint 11 - Road damage, resolved
      {
        title: 'Pothole on Oak Street repaired',
        description: 'Large pothole filled and road resurfaced on Oak Street between 3rd and 4th.',
        category: 'Road Damage',
        priority: 'medium',
        status: 'resolved',
        location: {
          areaName: 'Oak Street Business District',
          coordinates: {
            latitude: 40.7145,
            longitude: -74.0095
          }
        },
        assignedTeam: {
          name: 'Road Repair Crew 3',
          members: ['Steve M.', 'Patty L.']
        },
        images: [
          {
            url: 'https://images.example.org/oak_road_after.jpg',
            uploadedAt: new Date('2025-04-12')
          }
        ],
        updates: [
          {
            status: 'pending',
            comment: 'Pothole reported',
            updatedAt: new Date('2025-04-10')
          },
          {
            status: 'under_review',
            comment: 'Assessment completed',
            updatedAt: new Date('2025-04-10')
          },
          {
            status: 'in_progress',
            comment: 'Repair work commenced',
            updatedAt: new Date('2025-04-11')
          },
          {
            status: 'resolved',
            comment: 'Repair completed and inspected',
            updatedAt: new Date('2025-04-12')
          }
        ],
        createdAt: new Date('2025-04-10T09:00:00'),
        updatedAt: new Date('2025-04-12T15:00:00')
      },

      // Complaint 12 - Electricity, pending
      {
        title: 'Flickering street lights on Main Blvd',
        description: 'Multiple street lights on Main Boulevard flickering intermittently at night. Safety concern.',
        category: 'Electricity Fault',
        priority: 'low',
        status: 'pending',
        location: {
          areaName: 'Main Boulevard',
          coordinates: {
            latitude: 40.7110,
            longitude: -74.002
          }
        },
        assignedTeam: {
          name: '',
          members: []
        },
        images: [],
        updates: [
          {
            status: 'pending',
            comment: 'Complaint filed',
            updatedAt: new Date('2025-04-29T20:00:00')
          }
        ],
        createdAt: new Date('2025-04-29T19:55:00'),
        updatedAt: new Date('2025-04-29T20:00:00')
      }
    ];

    await Complaint.insertMany(complaints);
    console.log(`Successfully seeded ${complaints.length} complaints`);

    await Streetlight.deleteMany({});
    console.log('Cleared existing streetlights');

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
    };

    await Streetlight.insertMany(streetlights);
    console.log(`Successfully seeded ${streetlights.length} streetlights`);
    console.log('NOTE: Streetlight coordinates are prototype/demo locations clustered around a simulated campus area.`);

    console.log('\n=== CivicResolve issue seed data ===');
    console.log('\nSample data created successfully!');
    console.log('\nThe database contains:');
    console.log(`- ${complaints.length} total complaints`);
    console.log(`- Categories: ${[...new Set(complaints.map(c => c.category))].join(', ')}`);
    console.log(`- Locations: ${[...new Set(complaints.map(c => c.location.areaName))].join(', ')}`);
    console.log(`- High priority: ${complaints.filter(c => c.priority === 'high').length}`);
    console.log(`- With updates: ${complaints.filter(c => c.updates.length > 0).length}`);
    console.log(`- With images: ${complaints.filter(c => c.images.length > 0).length}`);
    console.log('\nBackend API endpoints:');
    console.log('  GET  /api/complaints                  - List all complaints');
    console.log('  GET  /api/complaints/:id             - Get single complaint');
    console.log('  POST /api/complaints                 - Create new complaint');
    console.log('  PUT  /api/complaints/:id             - Update complaint');
    console.log('  DELETE /api/complaints/:id           - Delete complaint');
    console.log('  POST /api/complaints/:id/updates     - Add status update');
    console.log('  POST /api/complaints/:id/images      - Add image');
    console.log('  GET  /api/reports/category           - Complaints per category');
    console.log('  GET  /api/reports/area               - Complaints per area');
    console.log('  GET  /api/reports/high-priority      - High priority count');
    console.log('  GET  /api/reports/monthly-trend      - Monthly trend');
    console.log('  GET  /api/reports/hotspots           - Top 5 hotspot areas');
    console.log('  GET  /api/reports/status             - Status distribution');
    console.log('  GET  /api/reports/priority           - Priority distribution');
    console.log('  GET  /api/streetlights               - List streetlights');
    console.log('  GET  /api/streetlights/:id          - Get single streetlight');
    console.log('  POST /api/streetlights              - Create streetlight (admin)');
    console.log('  PATCH /api/streetlights/:id         - Update streetlight (admin)');
    console.log('\n===========================================================');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
