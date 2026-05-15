// Sourced from workflow.js — workflow.js is the single source of truth.
export { CANDIDATE_STATUSES } from './workflow.js';

export const PASSPORT_STATUSES = [
  'not_received',
  'received',
  'with_agent',
  'with_agency',
  'returned_to_candidate'
];

export const MEDICAL_RESULTS = [
  'pending',
  'fit',
  'unfit',
  'recheck_required'
];

export const ORIENTATION_STATUSES = [
  'not_attended',
  'attended',
  'completed'
];

export const JOB_DEMAND_STATUSES = [
  'draft',
  'pending',
  'active',
  'filled',
  'expired',
  'cancelled'
];

export const DEMAND_LETTER_STATUSES = [
  'requested',
  'received',
  'expired'
];

export const TASK_PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent'
];

export const TASK_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'cancelled'
];

export const FEE_TYPES = [
  'service_fee',
  'document_charge',
  'medical_charge',
  'orientation_charge',
  'insurance_charge',
  'visa_charge',
  'other'
];

export const FEE_PAYMENT_MODES = [
  'cash',
  'bank_transfer',
  ' Esewa / Khalti / IME Pay',
  'cheque'
];
  
export const ALERT_SEVERITIES = [
  'critical',
  'warning',
  'info'
];

export const ALERT_TYPES = [
  'passport_expiring',
  'medical_expiring',
  'demand_expiring',
  'swukriti_expiring',
  'insurance_expiring',
  'dofe_license_expiring',
  'process_stalled',
  'medical_failed',
  'orientation_missing',
  'fee_outstanding'
];