const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedDevUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/municipal_complaints');
    const passwordHash = await bcrypt.hash(process.env.SEED_CITIZEN_PASSWORD || 'change_me_citizen', 10);
    const officialHash = await bcrypt.hash(process.env.SEED_OFFICIAL_PASSWORD || 'change_me_official', 10);
    const adminHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'change_me_admin', 10);

    const users = [
      { name: 'Development Citizen', email: 'citizen.dev@example.org', passwordHash, role: 'CITIZEN', active: true },
      { name: 'Development Official', email: 'official.dev@example.org', passwordHash: officialHash, role: 'MUNICIPAL_OFFICIAL', active: true },
      { name: 'Development Admin', email: 'admin.dev@example.org', passwordHash: adminHash, role: 'ADMIN', active: true }
    ];

    await User.deleteMany({ email: { $regex: 'dev@example\.org$' } });
    await User.insertMany(users);
    console.log('Development users created');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedDevUsers();
