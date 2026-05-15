import mongoose from 'mongoose';
import { formatBSDisplay } from '../utils/bsDate.js';

const agencySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  subdomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  plan: {
    type: String,
    enum: ['trial', 'basic', 'pro'],
    default: 'trial'
  },
  planExpiresAt: Date,
  trialStartedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    nameNepali: String,
    dofeLicenseNumber: String,
    dofeLicenseExpiry: Date,
    logo: String,
    website: String,
    serviceFeeDefaults: {
      type: Map,
      of: Number,
      default: {}
    },
    notificationPreferences: {
      passportExpiryDays: { type: Number, default: 60 },
      medicalExpiryDays: { type: Number, default: 30 },
      demandExpiryDays: { type: Number, default: 14 },
      swukritiExpiryDays: { type: Number, default: 14 },
      insuranceExpiryDays: { type: Number, default: 30 },
      enabledAlertTypes: {
        type: [String],
        default: ['passport_expiring', 'medical_expiring', 'demand_expiring', 'medical_failed', 'process_stalled']
      }
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    timezone: { type: String, default: 'UTC' },
    dateFormat: { type: String, default: 'YYYY-MM-DD' },
    currency: { type: String, default: 'USD' }
  }
}, {
  timestamps: true
});

agencySchema.virtual('dofeLicenseExpiryBS').get(function() {
  return this.settings?.dofeLicenseExpiry ? formatBSDisplay(this.settings.dofeLicenseExpiry) : null;
});

agencySchema.set('toJSON', { virtuals: true });
agencySchema.set('toObject', { virtuals: true });

export default mongoose.model('Agency', agencySchema);