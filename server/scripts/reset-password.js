import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function resetPassword() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model(
      'User',
      new mongoose.Schema(
        { email: String, passwordHash: String, name: String, role: String },
        { strict: false }
      )
    );

    const superAdmin = await User.findOne({ role: 'superadmin' });

    if (!superAdmin) {
      console.log('❌ No super admin found!');
      process.exit(1);
    }

    const newPassword = 'Admin@123456';
    const salt = await bcrypt.genSalt(10);
    superAdmin.passwordHash = await bcrypt.hash(newPassword, salt);
    await superAdmin.save();

    console.log('✅ Password reset successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:    ${superAdmin.email}`);
    console.log(`🔑 Password: ${newPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();
