import mongoose from 'mongoose';
import { formatBSDisplay } from '../utils/bsDate.js';

const insuranceSsfSchema = new mongoose.Schema({
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
    index: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  insurancePolicyNumber: String,
  insurancePolicyName: String,
  insuranceCompany: String,
  insuranceBranch: String,
  insurancePremiumNPR: {
    type: Number,
    default: 1674
  },
  insurancePaidDate: Date,
  insurancePaidReceiptUrl: String,
  insuranceCoverageYears: {
    type: Number,
    default: 2
  },
  insuranceExpiryDate: Date,
  ssfRegistrationNumber: String,
  ssfContributionNPR: {
    type: Number,
    default: 2595
  },
  ssfPaidDate: Date,
  ssfReceiptNumber: String,
  ssfReceiptUrl: String,
  welfareFundPaid: {
    type: Boolean,
    default: false
  },
  welfareFundAmount: Number,
  welfareFundReceiptNumber: String,
  welfareFundPaidDate: Date,
  overallStatus: {
    type: String,
    enum: ['pending', 'partially_done', 'completed'],
    default: 'pending'
  },
  notes: String
}, {
  timestamps: true
});

insuranceSsfSchema.index({ agencyId: 1, candidateId: 1 });
insuranceSsfSchema.index({ agencyId: 1, overallStatus: 1 });
insuranceSsfSchema.index({ agencyId: 1, insuranceExpiryDate: 1 }); // For expiry alert queries

insuranceSsfSchema.virtual('insurancePaidDateBS').get(function() {
  return this.insurancePaidDate ? formatBSDisplay(this.insurancePaidDate) : null;
});

insuranceSsfSchema.virtual('insuranceExpiryDateBS').get(function() {
  return this.insuranceExpiryDate ? formatBSDisplay(this.insuranceExpiryDate) : null;
});

insuranceSsfSchema.virtual('ssfPaidDateBS').get(function() {
  return this.ssfPaidDate ? formatBSDisplay(this.ssfPaidDate) : null;
});

insuranceSsfSchema.set('toJSON', { virtuals: true });
insuranceSsfSchema.set('toObject', { virtuals: true });

insuranceSsfSchema.pre('save', function(next) {
  const insurancePaid = !!this.insurancePaidDate && !!this.insurancePolicyNumber;
  const ssfPaid = !!this.ssfPaidDate && !!this.ssfRegistrationNumber;
  const welfarePaid = this.welfareFundPaid === true;

  const paidCount = [insurancePaid, ssfPaid, welfarePaid].filter(Boolean).length;

  if (paidCount === 0) {
    this.overallStatus = 'pending';
  } else if (paidCount === 3) {
    this.overallStatus = 'completed';
  } else {
    this.overallStatus = 'partially_done';
  }

  if (this.insurancePaidDate && !this.insuranceExpiryDate) {
    const expiry = new Date(this.insurancePaidDate);
    expiry.setFullYear(expiry.getFullYear() + (this.insuranceCoverageYears || 2));
    this.insuranceExpiryDate = expiry;
  }

  next();
});

export default mongoose.model('InsuranceSsf', insuranceSsfSchema);