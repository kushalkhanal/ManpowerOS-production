import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const userSchema = new mongoose.Schema({
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: false },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
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
  createdAt: { type: Date, default: Date.now },
});

const Agency = mongoose.model('Agency', agencySchema);

async function seedSuperAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('⚠️  Super admin already exists!');
      console.log(`📧 Email: ${existingSuperAdmin.email}`);
      process.exit(0);
    }

    const agency = await Agency.create({
      name: 'ManpowerOS Admin',
      subdomain: 'admin',
      plan: 'enterprise',
      isActive: true,
    });

    await User.create({
      agencyId: agency._id,
      name: 'Super Admin',
      email: 'admin@manpoweros.com',
      passwordHash: 'Admin@123456',
      role: 'superadmin',
      isActive: true,
    });

    console.log('\n✅ Super Admin created successfully!\n');
    console.log('📧 Email:    admin@manpoweros.com');
    console.log('🔑 Password: Admin@123456');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedSuperAdmin();
