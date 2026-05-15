import mongoose from 'mongoose';
import { formatBSDisplay } from '../utils/bsDate.js';

const DOCUMENT_CATEGORIES = [
  'license',
  'contract',
  'template',
  'legal',
  'financial',
  'training',
  'marketing',
  'correspondence',
  'other'
];

const agencyDocumentSchema = new mongoose.Schema({
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
    index: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: DOCUMENT_CATEGORIES,
    required: true,
    index: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileType: {
    type: String,
    trim: true
  },
  fileSizeKB: {
    type: Number,
    min: 0
  },
  visibleToRoles: [{
    type: String,
    enum: ['admin', 'manager', 'documentation', 'accounts', 'agent']
  }],
  isConfidential: {
    type: Boolean,
    default: false
  },
  version: {
    type: String,
    trim: true
  },
  previousVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgencyDocument'
  },
  expiryDate: {
    type: Date,
    index: true
  },
  expiryAlertDays: {
    type: Number,
    default: 60
  },
  tags: [{
    type: String,
    trim: true
  }],
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

agencyDocumentSchema.index({ agencyId: 1, category: 1 });
agencyDocumentSchema.index({ agencyId: 1, expiryDate: 1 });
agencyDocumentSchema.index({ agencyId: 1, category: 1, expiryDate: 1 }); // For license expiry alert queries
agencyDocumentSchema.index({ agencyId: 1, title: 'text', tags: 'text' });

agencyDocumentSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const days = Math.ceil((new Date(this.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  return days;
});

agencyDocumentSchema.virtual('expiryDateBS').get(function() {
  return this.expiryDate ? formatBSDisplay(this.expiryDate) : null;
});

agencyDocumentSchema.set('toJSON', { virtuals: true });
agencyDocumentSchema.set('toObject', { virtuals: true });

export const DOCUMENT_CATEGORIES_LIST = DOCUMENT_CATEGORIES;

export default mongoose.model('AgencyDocument', agencyDocumentSchema);