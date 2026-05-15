import mongoose from 'mongoose';
import { formatBSDisplay } from '../utils/bsDate.js';

const TRANSACTION_TYPES = ['service_fee', 'document_charge', 'medical_charge', 'orientation_charge', 'insurance_charge', 'visa_charge', 'other'];
const DIRECTION = ['received', 'refund'];
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'esewa', 'khalti', 'ime_pay', 'cheque'];

const feeTransactionSchema = new mongoose.Schema({
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
  transactionType: {
    type: String,
    enum: TRANSACTION_TYPES,
    required: true
  },
  direction: {
    type: String,
    enum: DIRECTION,
    required: true
  },
  amountNPR: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: PAYMENT_METHODS
  },
  transactionReference: {
    type: String,
    trim: true
  },
  paidAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  },
  receiptUrl: {
    type: String
  }
}, {
  timestamps: true
});

feeTransactionSchema.index({ agencyId: 1, candidateId: 1 });
feeTransactionSchema.index({ agencyId: 1, transactionType: 1 });
feeTransactionSchema.index({ agencyId: 1, paidAt: -1 });
feeTransactionSchema.index({ agencyId: 1, direction: 1 });

feeTransactionSchema.virtual('displayAmount').get(function() {
  return this.direction === 'received' ? this.amountNPR : -this.amountNPR;
});

feeTransactionSchema.virtual('paidAtBS').get(function() {
  return this.paidAt ? formatBSDisplay(this.paidAt) : null;
});

feeTransactionSchema.set('toJSON', { virtuals: true });
feeTransactionSchema.set('toObject', { virtuals: true });

export const TRANSACTION_TYPES_LIST = TRANSACTION_TYPES;
export const DIRECTION_LIST = DIRECTION;
export const PAYMENT_METHODS_LIST = PAYMENT_METHODS;

export default mongoose.model('FeeTransaction', feeTransactionSchema);