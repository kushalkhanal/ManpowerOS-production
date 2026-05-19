import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/manpoweros';

async function unlockUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = process.argv[2] || 'manpower@gmail.com';

    const result = await User.updateOne(
      { email },
      { $set: { failedLoginAttempts: 0, lockedUntil: null, isActive: true } }
    );

    if (result.matchedCount > 0) {
      console.log(`User ${email} has been unlocked and failed attempts reset.`);
    } else {
      console.log(`User ${email} not found.`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

unlockUser();
