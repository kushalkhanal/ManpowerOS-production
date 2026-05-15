import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/manpoweros';

async function unlockUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateOne(
      { email: 'manpower@gmail.com' },
      { 
        $set: { 
          failedLoginAttempts: 0, 
          lockedUntil: null,
          isActive: true 
        } 
      }
    );

    if (result.matchedCount > 0) {
      console.log('User manpower@gmail.com has been unlocked and failed attempts reset.');
    } else {
      console.log('User manpower@gmail.com not found.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

unlockUser();
