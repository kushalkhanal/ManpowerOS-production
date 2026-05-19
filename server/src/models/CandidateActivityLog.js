import mongoose from 'mongoose';

const ACTION_TYPES = ['created', 'updated', 'file_uploaded', 'status_changed', 'marked_complete', 'deleted'];

const candidateActivityLogSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
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
  performerName: {
    type: String,
    required: true
  },
  columnId: {
    type: String,
    required: true,
    enum: ['medical', 'orientation', 'insurance', 'fee', 'visa', 'feims', 'departure', 'document']
  },
  action: {
    type: String,
    required: true,
    enum: ACTION_TYPES
  },
  details: String,
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  fileUrl: String,
  fileName: String,
  referenceId: mongoose.Schema.Types.ObjectId,
  referenceModel: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

candidateActivityLogSchema.index({ agencyId: 1, candidateId: 1, timestamp: -1 }); // primary access pattern
candidateActivityLogSchema.index({ candidateId: 1, timestamp: -1 });
candidateActivityLogSchema.index({ agencyId: 1, timestamp: -1 });
candidateActivityLogSchema.index({ performedBy: 1, timestamp: -1 });
candidateActivityLogSchema.index({ columnId: 1, timestamp: -1 });

export default mongoose.model('CandidateActivityLog', candidateActivityLogSchema);