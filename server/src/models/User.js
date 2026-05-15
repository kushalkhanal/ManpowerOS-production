import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { formatBSDisplay } from '../utils/bsDate.js';

const DEPARTMENTS = ['operations', 'documentation', 'accounts', 'field', 'management'];

const userSchema = new mongoose.Schema({
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: false,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'manager', 'accounts', 'documentation', 'agent', 'staff'],
    required: true
  },
  phone: String,
  address: String,
  photo: String,
  joiningDate: Date,
  salaryNPR: Number,
  department: {
    type: String,
    enum: DEPARTMENTS
  },
  permissions: {
    canEditCandidates: { type: Boolean, default: true },
    canDeleteCandidates: { type: Boolean, default: false },
    canViewFinance: { type: Boolean, default: false },
    canExportData: { type: Boolean, default: false },
    canManageStaff: { type: Boolean, default: false },
    canSendAlerts: { type: Boolean, default: false },
    canViewAuditLog: { type: Boolean, default: false }
  },
  loginCount: { type: Number, default: 0 },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  deactivatedAt: Date,
  deactivatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaSecret: String,
  lastLoginAt: Date,
  mustChangePassword: {
    type: Boolean,
    default: true
  },
  inviteToken: String,
  inviteTokenExpires: Date
}, {
  timestamps: true
});

userSchema.index({ email: 1 }, { unique: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

const DEFAULT_PERMISSIONS = {
  superadmin: {
    canEditCandidates: true,
    canDeleteCandidates: true,
    canViewFinance: true,
    canExportData: true,
    canManageStaff: true,
    canSendAlerts: true,
    canViewAuditLog: true
  },
  admin: {
    canEditCandidates: true,
    canDeleteCandidates: true,
    canViewFinance: true,
    canExportData: true,
    canManageStaff: true,
    canSendAlerts: true,
    canViewAuditLog: true
  },
  manager: {
    canEditCandidates: true,
    canDeleteCandidates: false,
    canViewFinance: true,
    canExportData: true,
    canManageStaff: false,
    canSendAlerts: true,
    canViewAuditLog: false
  },
  accounts: {
    canEditCandidates: false,
    canDeleteCandidates: false,
    canViewFinance: true,
    canExportData: true,
    canManageStaff: false,
    canSendAlerts: false,
    canViewAuditLog: false
  },
  documentation: {
    canEditCandidates: true,
    canDeleteCandidates: false,
    canViewFinance: false,
    canExportData: true,
    canManageStaff: false,
    canSendAlerts: false,
    canViewAuditLog: false
  },
  agent: {
    canEditCandidates: false,
    canDeleteCandidates: false,
    canViewFinance: false,
    canExportData: false,
    canManageStaff: false,
    canSendAlerts: false,
    canViewAuditLog: false
  },
  staff: {
    canEditCandidates: true,
    canDeleteCandidates: false,
    canViewFinance: false,
    canExportData: false,
    canManageStaff: false,
    canSendAlerts: false,
    canViewAuditLog: false
  }
};

userSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    const defaultPerms = DEFAULT_PERMISSIONS[this.role] || DEFAULT_PERMISSIONS.agent;
    this.permissions = { ...defaultPerms, ...this.permissions };
  }
  next();
});

userSchema.virtual('joiningDateBS').get(function() {
  return this.joiningDate ? formatBSDisplay(this.joiningDate) : null;
});

userSchema.virtual('lastLoginAtBS').get(function() {
  return this.lastLoginAt ? formatBSDisplay(this.lastLoginAt) : null;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.mfaSecret;
  delete obj.failedLoginAttempts;
  delete obj.lockedUntil;
  delete obj.inviteToken;
  delete obj.inviteTokenExpires;
  return obj;
};

export default mongoose.model('User', userSchema);