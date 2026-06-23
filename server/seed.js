const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const USERS = [
  {
    username: 'heartbeat_admin',
    email: 'admin@auctionx.net',
    password: 'password123'
  },
  {
    username: 'bidder_node_a',
    email: 'bidder_a@auctionx.net',
    password: 'password123'
  },
  {
    username: 'bidder_node_b',
    email: 'bidder_b@auctionx.net',
    password: 'password123'
  }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/auctionx';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for seeding.');

    // Clear existing users
    await User.deleteMany({
      username: { $in: ['heartbeat_admin', 'bidder_node_a', 'bidder_node_b'] }
    });
    console.log('Cleared existing test users.');

    // Hash passwords and save
    const salt = await bcrypt.genSalt(10);
    for (const u of USERS) {
      const passwordHash = await bcrypt.hash(u.password, salt);
      await User.create({
        username: u.username,
        email: u.email,
        passwordHash
      });
      console.log(`Seeded User: ${u.username} (${u.email}) | Password: ${u.password}`);
    }

    console.log('Database seeding successfully finished.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();
