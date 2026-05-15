/**
 * Seed Script - Create First Super Admin
 * Run this script ONCE to create your first super admin user
 * Usage: node seed-superadmin.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

// Import models after env is loaded
const userSchema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: false },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Password hashing
import bcrypt from 'bcryptjs';

userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

const User = mongoose.model('User', userSchema);

const agencySchema = new mongoose.Schema({
  name: { type: String, required: true },
  subdomain: { type: String, required: true, unique: true },
  plan: { type: String, default: 'trial' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Agency = mongoose.model('Agency', agencySchema);

async function seedSuperAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if any super admin exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('⚠️  Super admin already exists!');
      console.log(`📧 Email: ${existingSuperAdmin.email}`);
      console.log('\nIf you forgot the password, delete this user from MongoDB and run this script again.');
      process.exit(0);
    }

    console.log('\n🎯 Creating Super Admin...\n');

    // Create main agency
    const agency = await Agency.create({
      name: 'ManpowerOS Admin',
      subdomain: 'admin',
      plan: 'enterprise',
      isActive: true
    });

    console.log('✅ Agency created:', agency.name);

    // Create super admin user
    const superAdmin = await User.create({
      agencyId: agency._id,
      name: 'Super Admin',
      email: 'admin@manpoweros.com',
      passwordHash: 'Admin@123456', // Will be hashed by pre-save hook
      role: 'superadmin',
      isActive: true
    });

    console.log('\n✅ Super Admin created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:    admin@manpoweros.com`);
    console.log(`🔑 Password: Admin@123456`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Login at: http://localhost:5173');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedSuperAdmin();
