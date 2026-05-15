import mongoose from 'mongoose';
import { formatBSDisplay } from '../utils/bsDate.js';

const tradeTestSchema = new mongoose.Schema({
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
  tradeCategory: {
    type: String,
    trim: true
  },
  testCenter: {
    type: String,
    trim: true
  },
  testCenterCode: {
    type: String,
    trim: true
  },
  testCenterLocation: {
    type: String,
    trim: true
  },
  scheduledDate: Date,
  conductedDate: Date,
  result: {
    type: String,
    enum: ['pending', 'pass', 'fail', 'absent'],
    default: 'pending'
  },
  certificateNumber: {
    type: String,
    trim: true
  },
  ctevtRegistrationNumber: {
    type: String,
    trim: true
  },
  certificateFileUrl: String,
  certificateFilePublicId: String,
  certificateIssuedDate: Date,
  // Certificate validity — most CTEVeT certs valid 2 years
  validityMonths: {
    type: Number,
    default: 24
  },
  expiryDate: Date,
  retestScheduledDate: Date,
  failReason: String,
  absentReason: String,
  notes: String
}, {
  timestamps: true
});

tradeTestSchema.index({ agencyId: 1, candidateId: 1 });
tradeTestSchema.index({ agencyId: 1, result: 1 });
tradeTestSchema.index({ agencyId: 1, expiryDate: 1 });

tradeTestSchema.pre('save', function (next) {
  if (this.conductedDate && this.result === 'pass' && !this.expiryDate) {
    const expiry = new Date(this.conductedDate);
    expiry.setMonth(expiry.getMonth() + this.validityMonths);
    this.expiryDate = expiry;
  }
  next();
});

tradeTestSchema.virtual('scheduledDateBS').get(function () {
  return this.scheduledDate ? formatBSDisplay(this.scheduledDate) : null;
});
tradeTestSchema.virtual('conductedDateBS').get(function () {
  return this.conductedDate ? formatBSDisplay(this.conductedDate) : null;
});
tradeTestSchema.virtual('expiryDateBS').get(function () {
  return this.expiryDate ? formatBSDisplay(this.expiryDate) : null;
});

tradeTestSchema.set('toJSON', { virtuals: true });
tradeTestSchema.set('toObject', { virtuals: true });

export default mongoose.model('TradeTest', tradeTestSchema);
