const mongoose = require('mongoose');

const createUsers = async () => {
  try {
    // Use direct connection string
    await mongoose.connect('mongodb://localhost:27017/municipal_complaints');
    console.log('MongoDB connected');

    const db = mongoose.connection.db;
    
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);
    
    // Delete existing test users
    await db.collection('users').deleteMany({ 
      email: { $in: ['admin@municipal.gov', 'john@example.com', 'jane@example.com'] } 
    });
    
    // Create admin user
    await db.collection('users').insertOne({
      fullName: 'Admin User',
      email: 'admin@municipal.gov',
      password: adminPassword,
      role: 'admin',
      createdAt: new Date()
    });
    console.log('Admin created: admin@municipal.gov / admin123');
    
    // Create citizen users
    await db.collection('users').insertMany([
      {
        fullName: 'John Citizen',
        email: 'john@example.com',
        password: userPassword,
        role: 'citizen',
        createdAt: new Date()
      },
      {
        fullName: 'Jane Citizen',
        email: 'jane@example.com',
        password: userPassword,
        role: 'citizen',
        createdAt: new Date()
      }
    ]);
    console.log('Citizens created: john@example.com / user123');
    console.log('john@example.com / user123');
    
    console.log('\n✅ Users ready!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createUsers();