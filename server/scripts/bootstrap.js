import crypto from 'crypto';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const args = process.argv.slice(2);
const command = args[0];

if (command !== 'create-superadmin') {
  console.log('Usage: node scripts/bootstrap.js create-superadmin <email> <password>');
  console.log('');
  console.log('This command is valid for one-time use only.');
  console.log('It will be invalidated after execution.');
  process.exit(1);
}

const email = args[1];
const password = args[2];

if (!email || !password) {
  console.error('Error: Email and password are required');
  process.exit(1);
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
if (!passwordRegex.test(password)) {
  console.error('Error: Password must be at least 8 characters and contain:');
  console.error('  - Uppercase letter');
  console.error('  - Lowercase letter');
  console.error('  - Number');
  console.error('  - Special character (@$!%*?&)');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/manpoweros';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    const existingSuperadmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperadmin) {
      console.error('Error: Super admin already exists');
      console.error('Bootstrap mechanism has been used.');
      process.exit(1);
    }

    const bootstrapSecret = process.env.BOOTSTRAP_SECRET;
    if (!bootstrapSecret || bootstrapSecret === 'your-bootstrap-secret-change-in-production') {
      console.error('Error: BOOTSTRAP_SECRET is not properly configured in .env');
      console.error('Please set a secure bootstrap secret before proceeding.');
      process.exit(1);
    }

    await User.create({
      agencyId: null,
      name: 'Super Admin',
      email: email.toLowerCase(),
      passwordHash: password,
      role: 'superadmin',
      mfaEnabled: false,
      isActive: true,
      mustChangePassword: false,
    });

    console.log('Super admin created successfully:');
    console.log(`  Email: ${email}`);
    console.log('');
    console.log('IMPORTANT: Bootstrap mechanism has been invalidated.');
    console.log('You must now configure MFA for this super admin account.');

    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Error:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  });
