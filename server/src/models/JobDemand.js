import mongoose from 'mongoose';
import { formatBSDisplay } from '../utils/bsDate.js';

const JOB_CATEGORIES = [
  'Construction Worker', 'Cleaner', 'Caregiver', 'Driver', 'Cook',
  'Welder', 'Mason', 'Helper', 'Electrician', 'Plumber',
  'Mechanic', 'Tailor', 'Security Guard', 'Housekeeper', 'Nurse',
  'Technician', 'Operator', 'Supervisor', 'Manager', 'Other'
];

const COUNTRIES = [
  'Qatar', 'Saudi Arabia', 'UAE', 'Kuwait', 'Malaysia', 'Bahrain', 'Oman',
  'South Korea', 'Japan', 'Israel', 'Poland', 'Romania', 'Croatia', 'Other'
];

const jobDemandSchema = new mongoose.Schema({
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
    index: true
  },
  employerCompanyName: {
    type: String,
    required: true,
    trim: true
  },
  shortCompanyCode: {
    type: String,
    trim: true,
    maxlength: 20
  },
  employerCountry: {
    type: String,
    required: true,
    enum: COUNTRIES
  },
  employerCity: String,
  employerContactPerson: String,
  employerPhone: String,
  employerEmail: String,
  demandLetterNumber: {
    type: String,
    trim: true
  },
  lotNumber: {
    type: String,
    required: true,
    trim: true
  },
  demandLetterDate: Date,
  demandLetterExpiryDate: Date,
  jobCategory: {
    type: String,
    enum: [...JOB_CATEGORIES, 'Other']
  },
  totalPositions: {
    type: Number,
    required: true,
    min: 1
  },
  filledPositions: {
    type: Number,
    default: 0,
    min: 0
  },
  basicSalaryUSD: Number,
  accommodationProvided: {
    type: Boolean,
    default: false
  },
  foodProvided: {
    type: Boolean,
    default: false
  },
  contractDurationMonths: Number,
  workingHoursPerDay: Number,
  purbaSwukritiNumber: String,
  purbaSwukritiDate: Date,
  purbaSwukritiExpiryDate: Date,
  demandLetterFileUrl: String,
  powerOfAttorneyFileUrl: String,
  embassyAttestedDemandUrl: String,
  status: {
    type: String,
    enum: ['active', 'filled', 'expired', 'cancelled'],
    default: 'active'
  },
  assignedCandidates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate'
  }],
  notes: String,
  minAge: Number,
  maxAge: Number,
  genderPreference: {
    type: String,
    enum: ['male', 'female', 'any'],
    default: 'any'
  },
  requiredPassportValidityMonths: {
    type: Number,
    default: 6
  },
  requiredSkills: [String],
  physicalRequirements: String
}, {
  timestamps: true
});

jobDemandSchema.index({ agencyId: 1, status: 1 });
jobDemandSchema.index({ agencyId: 1, employerCountry: 1 });
jobDemandSchema.index({ agencyId: 1, jobCategory: 1 });
jobDemandSchema.index({ agencyId: 1, demandLetterExpiryDate: 1 });
jobDemandSchema.index({ agencyId: 1, purbaSwukritiExpiryDate: 1 }); // For swukriti alert queries
jobDemandSchema.index({ agencyId: 1, demandLetterNumber: 1 }, { unique: true, sparse: true });

jobDemandSchema.virtual('remainingPositions').get(function() {
  return this.totalPositions - this.filledPositions;
});

jobDemandSchema.virtual('demandLetterDateBS').get(function() {
  return this.demandLetterDate ? formatBSDisplay(this.demandLetterDate) : null;
});

jobDemandSchema.virtual('demandLetterExpiryDateBS').get(function() {
  return this.demandLetterExpiryDate ? formatBSDisplay(this.demandLetterExpiryDate) : null;
});

jobDemandSchema.virtual('purbaSwukritiDateBS').get(function() {
  return this.purbaSwukritiDate ? formatBSDisplay(this.purbaSwukritiDate) : null;
});

jobDemandSchema.virtual('purbaSwukritiExpiryDateBS').get(function() {
  return this.purbaSwukritiExpiryDate ? formatBSDisplay(this.purbaSwukritiExpiryDate) : null;
});

jobDemandSchema.pre('save', function(next) {
  if (this.demandLetterExpiryDate && new Date(this.demandLetterExpiryDate) < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  if (this.filledPositions >= this.totalPositions && this.status === 'active') {
    this.status = 'filled';
  }
  next();
});

jobDemandSchema.set('toJSON', { virtuals: true });
jobDemandSchema.set('toObject', { virtuals: true });

export const JOB_CATEGORIES_LIST = JOB_CATEGORIES;
export const COUNTRIES_LIST = COUNTRIES;

export default mongoose.model('JobDemand', jobDemandSchema);