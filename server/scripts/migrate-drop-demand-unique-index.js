import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/manpoweros';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  try {
    await mongoose.connection
      .collection('jobdemands')
      .dropIndex('agencyId_1_demandLetterNumber_1');
    console.log('Dropped old unique demandLetterNumber index');
  } catch (e) {
    console.log('Index not found or already dropped — nothing to do');
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
