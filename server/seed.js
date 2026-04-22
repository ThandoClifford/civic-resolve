const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Complaint = require('./models/Complaint');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    await User.deleteMany({});
    await Complaint.deleteMany({});
    console.log('Cleared existing data');

    const admin = await User.create({
      fullName: 'Admin User',
      email: 'admin@municipal.gov',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Admin user created:', admin.email);

    const citizen1 = await User.create({
      fullName: 'John Citizen',
      email: 'john@example.com',
      password: 'user123',
      role: 'citizen'
    });

    const citizen2 = await User.create({
      fullName: 'Jane Citizen',
      email: 'jane@example.com',
      password: 'user123',
      role: 'citizen'
    });
    console.log('Citizen users created');

    const complaints = [
      {
        title: 'Illegal dumping behind grocery store',
        description: 'Large pile of trash and construction debris dumped behind the local grocery store on Main Street.',
        category: 'Illegal Dumping',
        latitude: 40.7128,
        longitude: -74.006,
        address: '123 Main St',
        priority: 'high',
        status: 'pending',
        reportedBy: citizen1._id
      },
      {
        title: 'Illegal dumping in alleyway',
        description: 'Furniture and household items dumped in the alley between 5th and 6th Avenue.',
        category: 'Illegal Dumping',
        latitude: 40.7150,
        longitude: -74.010,
        address: 'Alley between 5th and 6th Ave',
        priority: 'medium',
        status: 'under_review',
        reportedBy: citizen2._id
      },
      {
        title: 'Water leak on corner',
        description: 'Water leaking from a broken pipe on the corner of Oak and Elm streets.',
        category: 'Water Leak',
        latitude: 40.7200,
        longitude: -74.015,
        address: 'Oak and Elm St',
        priority: 'high',
        status: 'in_progress',
        reportedBy: citizen1._id
      },
      {
        title: 'Pothole on highway',
        description: 'Large pothole causing damage to vehicles on the highway exit ramp.',
        category: 'Road Damage',
        latitude: 40.7080,
        longitude: -74.020,
        address: 'Highway 95 Exit 12',
        priority: 'medium',
        status: 'pending',
        reportedBy: citizen2._id
      },
      {
        title: 'Street light out',
        description: 'Street light not working in residential area causing safety concerns.',
        category: 'Electricity Fault',
        latitude: 40.7100,
        longitude: -74.008,
        address: '456 Pine St',
        priority: 'low',
        status: 'resolved',
        reportedBy: citizen1._id
      },
      {
        title: 'Multiple illegal dumping reports',
        description: 'Several bags of garbage dumped near the park entrance.',
        category: 'Illegal Dumping',
        latitude: 40.7130,
        longitude: -74.007,
        address: 'Central Park Entrance',
        priority: 'medium',
        status: 'pending',
        reportedBy: citizen2._id
      },
      {
        title: 'More illegal dumping',
        description: 'Old appliances dumped near the river bank.',
        category: 'Illegal Dumping',
        latitude: 40.7135,
        longitude: -74.005,
        address: 'River Bank Road',
        priority: 'high',
        status: 'pending',
        reportedBy: citizen1._id
      },
      {
        title: 'Another dumping spot',
        description: 'Construction debris dumped in empty lot.',
        category: 'Illegal Dumping',
        latitude: 40.7125,
        longitude: -74.008,
        address: 'Empty Lot on 8th St',
        priority: 'medium',
        status: 'pending',
        reportedBy: citizen2._id
      },
      {
        title: 'Dumping near school',
        description: 'Trash dumped near the elementary school playground.',
        category: 'Illegal Dumping',
        latitude: 40.7140,
        longitude: -74.004,
        address: 'Elementary School',
        priority: 'high',
        status: 'under_review',
        reportedBy: citizen1._id
      },
      {
        title: 'More dumping reports',
        description: 'Household waste dumped in the woods.',
        category: 'Illegal Dumping',
        latitude: 40.7145,
        longitude: -74.003,
        address: 'Woods Area',
        priority: 'low',
        status: 'pending',
        reportedBy: citizen2._id
      }
    ];

    await Complaint.insertMany(complaints);
    console.log('Sample complaints created');

    console.log('\nSeed data created successfully!');
    console.log('\nTest accounts:');
    console.log('Admin: admin@municipal.gov / admin123');
    console.log('Citizen: john@example.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();