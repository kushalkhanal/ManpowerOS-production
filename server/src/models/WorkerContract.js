import mongoose from 'mongoose';
import { formatBSDisplay } from '../utils/bsDate.js';

const workerContractSchema = new mongoose.Schema({
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
  demandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDemand'
  },
  sponsorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sponsor'
  },
  contractType: {
    type: String,
    enum: ['standard', 'dofe_approved'],
    default: 'standard'
  },
  contractLanguage: {
    type: String,
    enum: ['nepali', 'english', 'arabic', 'other'],
    default: 'english'
  },
  // Compensation
  salary: {
    type: Number,
    min: 0
  },
  salaryCurrency: {
    type: String,
    trim: true,
    default: 'USD'
  },
  overtimeRatePerHour: {
    type: Number,
    min: 0
  },
  // Terms
  workingHoursPerDay: {
    type: Number,
    min: 1,
    max: 24
  },
  workingDaysPerWeek: {
    type: Number,
    min: 1,
    max: 7
  },
  accommodation: {
    type: String,
    enum: ['provided', 'allowance', 'self'],
    default: 'provided'
  },
  food: {
    type: String,
    enum: ['provided', 'allowance', 'self'],
    default: 'provided'
  },
  leavePerYear: {
    type: Number,
    min: 0
  },
  contractDurationMonths: {
    type: Number,
    min: 1
  },
  // Timeline
  contractStartDate: Date,
  actualStartDate: Date,
  contractExpiryDate: Date,
  renewalDate: Date,
  status: {
    type: String,
    enum: ['draft', 'signed', 'active', 'expired', 'terminated', 'renewed'],
    default: 'draft'
  },
  terminationReason: String,
  terminationDate: Date,
  renewalCount: {
    type: Number,
    default: 0
  },
  // DoFE approval
  dofeApprovedAt: Date,
  dofeApprovalNumber: {
    type: String,
    trim: true
  },
  // Document storage
  contractFileUrl: String,
  contractFilePublicId: String,
  notes: String
}, {
  timestamps: true
});

workerContractSchema.index({ agencyId: 1, candidateId: 1 });
workerContractSchema.index({ agencyId: 1, status: 1 });
workerContractSchema.index({ agencyId: 1, contractExpiryDate: 1 });

workerContractSchema.pre('save', function (next) {
  if (this.contractStartDate && this.contractDurationMonths && !this.contractExpiryDate) {
    const expiry = new Date(this.contractStartDate);
    expiry.setMonth(expiry.getMonth() + this.contractDurationMonths);
    this.contractExpiryDate = expiry;
  }
  next();
});

workerContractSchema.virtual('contractStartDateBS').get(function () {
  return this.contractStartDate ? formatBSDisplay(this.contractStartDate) : null;
});
workerContractSchema.virtual('contractExpiryDateBS').get(function () {
  return this.contractExpiryDate ? formatBSDisplay(this.contractExpiryDate) : null;
});

workerContractSchema.set('toJSON', { virtuals: true });
workerContractSchema.set('toObject', { virtuals: true });

export default mongoose.model('WorkerContract', workerContractSchema);
