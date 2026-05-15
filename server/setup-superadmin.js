import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/manpoweros';

async function setupSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'superadmin@gmail.com';
    const password = 'Password@123';

    // 1. Remove any existing user with this email to start fresh
    await User.deleteOne({ email });
    console.log(`Cleared existing data for ${email}`);

    // 2. Create the new Super Admin
    const superadmin = await User.create({
      agencyId: null,
      name: 'Global Super Admin',
      email: email,
      passwordHash: password, // The User model will hash this automatically in its pre-save hook
      role: 'superadmin',
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null
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
