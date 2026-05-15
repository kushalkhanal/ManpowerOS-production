/**
 * migrate-demand-assigned.js
 *
 * One-time migration: renames the legacy 'demand_assigned' candidate status
 * to 'demand_allocated' to match the Phase 1 pipeline redesign.
 *
 * This is the ONLY status that changed name. All other old statuses
 * (passport_collected, medical_scheduled, medical_passed, medical_failed,
 *  insurance_done, visa_applied, visa_stamped, flight_booked, shram_issued,
 *  departed, cancelled, on_hold) are still valid in the new enum.
 *
 * Usage (run once, from the server/ directory):
 *   node scripts/migrate-demand-assigned.js
 *
 * Safe to run multiple times — the $in filter only matches old values.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI not set in .env');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const collection = mongoose.connection.db.collection('candidates');

  const result = await collection.updateMany(
    { status: 'demand_assigned' },
    { $set: { status: 'demand_allocated' } }
  );

  console.log(`Migration complete: ${result.modifiedCount} candidate(s) updated from 'demand_assigned' → 'demand_allocated'`);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
