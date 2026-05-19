import mongoose from 'mongoose';

// Join table between Candidate and JobDemand. Replaces both
// Candidate.demandId and JobDemand.assignedCandidates[] so the link
// can't drift, and a candidate can move across multiple demands
// while preserving history.
const demandAssignmentSchema = new mongoose.Schema({
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
    index: true
  },
  demandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDemand',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'withdrawn', 'rejected', 'departed'],
    default: 'assigned'
  },
  assignedAt: { type: Date, default: Date.now },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  withdrawnAt: Date,
  withdrawnReason: String,
  notes: String
}, {
  timestamps: true
});

// A candidate can only be actively assigned to one demand at a time.
// Historical assignments (withdrawn/rejected/departed) stay on file.
demandAssignmentSchema.index(
  { agencyId: 1, candidateId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'assigned' } }
);
demandAssignmentSchema.index({ agencyId: 1, demandId: 1, status: 1 });
demandAssignmentSchema.index({ agencyId: 1, candidateId: 1 });

export default mongoose.model('DemandAssignment', demandAssignmentSchema);
