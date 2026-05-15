// Re-exported from workflow.js — workflow.js is the single source of truth.
export { CANDIDATE_STATUSES, STATUS_LABELS as CANDIDATE_STATUS_LABELS } from './workflow.js';

export const PASSPORT_STATUSES = [
  'not_received',
  'received',
  'with_agent',
  'with_agency',
  'returned_to_candidate'
];

export const PASSPORT_STATUS_LABELS = {
  not_received: 'Not Received',
  received: 'Received',
  with_agent: 'With Agent',
  with_agency: 'With Agency',
  returned_to_candidate: 'Returned to Candidate'
};

export const MEDICAL_RESULTS = [
  'pending',
  'fit',
  'unfit',
  'recheck_required'
];

export const MEDICAL_RESULT_LABELS = {
  pending: 'Pending',
  fit: 'Fit',
  unfit: 'Unfit',
  recheck_required: 'Recheck Required'
};

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

export const TASK_PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent'
];

export const TASK_PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
};

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

export const FEE_TYPE_LABELS = {
  service_fee: 'Service Fee',
  document_charge: 'Document Charge',
  medical_charge: 'Medical Charge',
  orientation_charge: 'Orientation Charge',
  insurance_charge: 'Insurance Charge',
  visa_charge: 'Visa Charge',
  other: 'Other'
};

export const ALERT_SEVERITIES = ['critical', 'warning', 'info'];

export const ALERT_SEVERITY_LABELS = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info'
};

export const TRANSACTION_TYPE_LABELS = {
  service_fee: 'Service Fee',
  medical_fee: 'Medical',
  orientation_fee: 'Orientation',
  insurance_fee: 'Insurance',
  ssf_fee: 'SSF',
  visa_fee: 'Visa',
  ticket_expense: 'Ticket',
  miscellaneous: 'Misc',
};