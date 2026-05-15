import mongoose from 'mongoose';

const passportLogSchema = new mongoose.Schema({
  passportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Passport',
    required: true,
    index: true
  },
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
    index: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  fromStatus: String,
  toStatus: String,
  notes: String,
  sponsorName: String,
  sponsorNumber: String,
  assignedStaff: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

passportLogSchema.index({ passportId: 1, timestamp: -1 });
passportLogSchema.index({ agencyId: 1, timestamp: -1 });

export default mongoose.model('PassportLog', passportLogSchema);