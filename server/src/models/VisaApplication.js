import mongoose from 'mongoose';
import { formatBSDisplay } from '../utils/bsDate.js';

const visaApplicationSchema = new mongoose.Schema({
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
  country: {
    type: String,
    trim: true
  },
  visaType: {
    type: String,
    enum: ['employment', 'work_permit', 'eps', 'specified_skilled', 'special'],
    default: 'employment'
  },
  embassyName: {
    type: String,
    trim: true
  },
  embassyCity: {
    type: String,
    trim: true
  },
  // GCC countries issue a "calling visa" (demand letter approval) before embassy submission
  callingVisaNumber: {
    type: String,
    trim: true
  },
  callingVisaReceivedDate: Date,
  applicationRef: {
    type: String,
    trim: true
  },
  appointmentDate: Date,
  submittedDate: Date,
  status: {
    type: String,
    enum: ['not_started', 'calling_visa_pending', 'appointed', 'submitted', 'stamped', 'rejected', 'cancelled'],
    default: 'not_started'
  },
  visaNumber: {
    type: String,
    trim: true
  },
  visaIssuedDate: Date,
  visaExpiryDate: Date,
  rejectionReason: String,
  rejectionDate: Date,
  // E-sticker is required by Malaysia (PLKS) and some other countries
  eStickerNumber: {
    type: String,
    trim: true
  },
  eStickerIssuedDate: Date,
  eStickerExpiryDate: Date,
  visaFileUrl: String,
  visaFilePublicId: String,
  eStickerFileUrl: String,
  eStickerFilePublicId: String,
  notes: String
}, {
  timestamps: true
});

visaApplicationSchema.index({ agencyId: 1, candidateId: 1 });
visaApplicationSchema.index({ agencyId: 1, status: 1 });
visaApplicationSchema.index({ agencyId: 1, country: 1 });
visaApplicationSchema.index({ agencyId: 1, visaExpiryDate: 1 });

visaApplicationSchema.virtual('appointmentDateBS').get(function () {
  return this.appointmentDate ? formatBSDisplay(this.appointmentDate) : null;
});
visaApplicationSchema.virtual('visaIssuedDateBS').get(function () {
  return this.visaIssuedDate ? formatBSDisplay(this.visaIssuedDate) : null;
});
visaApplicationSchema.virtual('visaExpiryDateBS').get(function () {
  return this.visaExpiryDate ? formatBSDisplay(this.visaExpiryDate) : null;
});

visaApplicationSchema.set('toJSON', { virtuals: true });
visaApplicationSchema.set('toObject', { virtuals: true });

export default mongoose.model('VisaApplication', visaApplicationSchema);
