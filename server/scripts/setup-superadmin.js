import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/manpoweros';

async function setupSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'superadmin@gmail.com';
    const password = 'Password@123';

    await User.deleteOne({ email });
    console.log(`Cleared existing data for ${email}`);

    await User.create({
      agencyId: null,
      name: 'Global Super Admin',
      email,
      passwordHash: password,
      role: 'superadmin',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    console.log('--------------------------------------------------');
    console.log('SUPER ADMIN CREATED SUCCESSFULLY');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('--------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error during Super Admin creation:', err);
    process.exit(1);
  }
}

setupSuperAdmin();
