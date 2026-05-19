import mongoose from 'mongoose';
import { formatBSDisplay } from '../utils/bsDate.js';

const orientationSchema = new mongoose.Schema({
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
  trainingCenter: {
    type: String,
    trim: true
  },
  trainingCenterCode: {
    type: String,
    trim: true
  },
  batchNumber: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  completionStatus: {
    type: String,
    enum: ['scheduled', 'completed', 'absent', 'failed'],
    default: 'scheduled'
  },
  certificateNumber: String,
  certificateIssuedDate: Date,
  feeAmount: {
    type: Number,
    default: 700
  },
  feePaidAt: Date,
  feeReceiptNumber: String,
  notes: String,
  notificationSent: {
    type: Boolean,
    default: false
  },
  certificateFileUrl: String,
  certificateFilePublicId: String,
  certificateUploadedAt: Date,
  certificateUploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attendanceSheetUrl: String,
  attendanceSheetPublicId: String
}, {
  timestamps: true
});

orientationSchema.index({ agencyId: 1, candidateId: 1 });
orientationSchema.index({ agencyId: 1, completionStatus: 1 });
orientationSchema.index({ agencyId: 1, startDate: 1 }); // batch/schedule queries

orientationSchema.virtual('startDateBS').get(function() {
  return this.startDate ? formatBSDisplay(this.startDate) : null;
});

orientationSchema.virtual('endDateBS').get(function() {
  return this.endDate ? formatBSDisplay(this.endDate) : null;
});

orientationSchema.virtual('certificateIssuedDateBS').get(function() {
  return this.certificateIssuedDate ? formatBSDisplay(this.certificateIssuedDate) : null;
});

orientationSchema.virtual('certificateUploadedAtBS').get(function() {
  return this.certificateUploadedAt ? formatBSDisplay(this.certificateUploadedAt) : null;
});

orientationSchema.set('toJSON', { virtuals: true });
orientationSchema.set('toObject', { virtuals: true });

orientationSchema.pre('save', function(next) {
  if (this.startDate && !this.endDate) {
    const end = new Date(this.startDate);
    end.setDate(end.getDate() + 2);
    this.endDate = end;
  }
  next();
});

export default mongoose.model('Orientation', orientationSchema);