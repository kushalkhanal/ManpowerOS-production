import mongoose from 'mongoose';
import { formatBSDisplay } from '../utils/bsDate.js';

const TASK_STATUS = ['pending', 'in_progress', 'completed', 'cancelled'];
const TASK_PRIORITY = ['low', 'medium', 'high', 'urgent'];
const TASK_TYPE = [
  'document_collection',
  'medical',
  'orientation',
  'insurance',
  'visa',
  'ticket',
  'police_clearance',
  'training',
  'meeting',
  'follow_up',
  'other'
];

const taskSchema = new mongoose.Schema({
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
    index: true
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
  taskType: {
    type: String,
    enum: TASK_TYPE,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate'
  },
  demandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDemand'
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: TASK_STATUS,
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: TASK_PRIORITY,
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

taskSchema.index({ agencyId: 1, status: 1 });
taskSchema.index({ agencyId: 1, assignedTo: 1 });
taskSchema.index({ agencyId: 1, dueDate: 1 });
taskSchema.index({ agencyId: 1, priority: 1 });

taskSchema.virtual('dueDateBS').get(function() {
  return this.dueDate ? formatBSDisplay(this.dueDate) : null;
});

taskSchema.virtual('completedAtBS').get(function() {
  return this.completedAt ? formatBSDisplay(this.completedAt) : null;
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

export const TASK_STATUS_LIST = TASK_STATUS;
export const TASK_PRIORITY_LIST = TASK_PRIORITY;
export const TASK_TYPE_LIST = TASK_TYPE;

export default mongoose.model('Task', taskSchema);