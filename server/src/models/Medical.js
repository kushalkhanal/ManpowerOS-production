import mongoose from 'mongoose';
import { formatBSDisplay } from '../utils/bsDate.js';

const medicalSchema = new mongoose.Schema({
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
  medicalType: {
    type: String,
    enum: ['gamca', 'wafid', 'other'],
    default: 'gamca'
  },
  medicalCenter: {
    type: String,
    trim: true
  },
  medicalCenterLocation: {
    type: String,
    trim: true
  },
  scheduledDate: Date,
  conductedDate: Date,
  reportNumber: {
    type: String,
    trim: true
  },
  result: {
    type: String,
    enum: ['pending', 'fit', 'unfit', 'on_hold'],
    default: 'pending'
  },
  reportExpiryDate: Date,
  reportFileUrl: String,
  notes: String,
  fitClearedAt: Date,
  unfitReason: String,
  recheckScheduledDate: Date,
  recheckNotificationSent: {
    type: Boolean,
    default: false
  },
  referringAgency: {
    type: String,
    trim: true
  },
  examinedBy: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

medicalSchema.index({ agencyId: 1, candidateId: 1 });
medicalSchema.index({ agencyId: 1, result: 1 });
medicalSchema.index({ agencyId: 1, reportExpiryDate: 1 });

medicalSchema.virtual('scheduledDateBS').get(function() {
  return this.scheduledDate ? formatBSDisplay(this.scheduledDate) : null;
});

medicalSchema.virtual('conductedDateBS').get(function() {
  return this.conductedDate ? formatBSDisplay(this.conductedDate) : null;
});

medicalSchema.virtual('reportExpiryDateBS').get(function() {
  return this.reportExpiryDate ? formatBSDisplay(this.reportExpiryDate) : null;
});

medicalSchema.set('toJSON', { virtuals: true });
medicalSchema.set('toObject', { virtuals: true });

export default mongoose.model('Medical', medicalSchema);