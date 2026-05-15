import mongoose from 'mongoose';

const sharedDocumentSchema = new mongoose.Schema({
  agencyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Agency', 
    required: true, 
    index: true 
  },
  candidateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Candidate', 
    index: true 
  },
  passportId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Passport', 
    index: true 
  },
  passportFile: { url: String, uploadedAt: Date },
  medicalFile: { url: String, uploadedAt: Date },
  visaFile: { url: String, uploadedAt: Date },
  stampingFile: { url: String, uploadedAt: Date },
  orientationFile: { url: String, uploadedAt: Date },
  photoFile: { url: String, uploadedAt: Date }
}, { 
  timestamps: true 
});

sharedDocumentSchema.index({ agencyId: 1, candidateId: 1 });
sharedDocumentSchema.index({ agencyId: 1, passportId: 1 });

export default mongoose.model('SharedDocument', sharedDocumentSchema);
