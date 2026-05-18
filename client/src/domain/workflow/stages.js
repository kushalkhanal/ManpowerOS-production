/**
 * Stages — client-side mirror of server/src/domain/workflow/stages.js.
 *
 * Adds UI metadata (icon name strings, Tailwind color tokens, display labels)
 * on top of the canonical domain definitions.
 *
 * Pure module — no React, no API. Safe to import anywhere.
 */

// ─── Stage IDs ────────────────────────────────────────────────────────────────

export const STAGE = Object.freeze({
  REGISTRATION:     'registration',
  DEMAND_MATCHING:  'demand_matching',
  TRADE_TEST:       'trade_test',
  DOCUMENTATION:    'documentation',
  MEDICAL:          'medical',
  CALLING_VISA:     'calling_visa',
  COMPLIANCE:       'compliance',
  ORIENTATION:      'orientation',
  PURBA_SWUKRITI:   'purba_swukriti',
  VISA_STAMPING:    'visa_stamping',
  PLKS:             'plks',
  FEIMS_SUBMISSION: 'feims_submission',
  SHRAM_SWUKRITI:   'shram_swukriti',
  DEPARTURE_PREP:   'departure_prep',
  POST_DEPARTURE:   'post_departure'
});

// ─── Status IDs ──────────────────────────────────────────────────────────────

export const STATUS = Object.freeze({
  REGISTERED:             'registered',
  PRE_SCREENED:           'pre_screened',
  DEMAND_SEARCHING:       'demand_searching',
  DEMAND_ALLOCATED:       'demand_allocated',
  TRADE_TEST_SCHEDULED:   'trade_test_scheduled',
  TRADE_TEST_PASSED:      'trade_test_passed',
  TRADE_TEST_FAILED:      'trade_test_failed',
  PASSPORT_PENDING:       'passport_pending',
  PASSPORT_COLLECTED:     'passport_collected',
  DOCUMENTS_COMPLETE:     'documents_complete',
  MEDICAL_SCHEDULED:      'medical_scheduled',
  MEDICAL_PASSED:         'medical_passed',
  MEDICAL_FAILED:         'medical_failed',
  MEDICAL_ON_HOLD:        'medical_on_hold',
  MEDICAL_EXPIRED:        'medical_expired',
  CALLING_VISA_PENDING:   'calling_visa_pending',
  CALLING_VISA_RECEIVED:  'calling_visa_received',
  COMPLIANCE_PENDING:     'compliance_pending',
  INSURANCE_DONE:         'insurance_done',
  SSF_DONE:               'ssf_done',
  WELFARE_DONE:           'welfare_done',
  COMPLIANCE_COMPLETE:    'compliance_complete',
  ORIENTATION_SCHEDULED:  'orientation_scheduled',
  ORIENTATION_COMPLETED:  'orientation_completed',
  ORIENTATION_ABSENT:     'orientation_absent',
  PURBA_SWUKRITI_APPLIED: 'purba_swukriti_applied',
  PURBA_SWUKRITI_ISSUED:  'purba_swukriti_issued',
  VISA_APPLIED:           'visa_applied',
  VISA_STAMPED:           'visa_stamped',
  VISA_REJECTED:          'visa_rejected',
  PLKS_APPLIED:           'plks_applied',
  PLKS_RECEIVED:          'plks_received',
  ESTICKER_APPLIED:       'esticker_applied',
  ESTICKER_RECEIVED:      'esticker_received',
  FEIMS_PENDING:          'feims_pending',
  FEIMS_SUBMITTED:        'feims_submitted',
  FEIMS_REGISTERED:       'feims_registered',
  SHRAM_APPLIED:          'shram_applied',
  SHRAM_ISSUED:           'shram_issued',
  FLIGHT_BOOKED:          'flight_booked',
  AIRPORT_SLOT_ASSIGNED:  'airport_slot_assigned',
  DEPARTED:               'departed',
  ABROAD:                 'abroad',
  CONTRACT_EXPIRED:       'contract_expired',
  RETURNED:               'returned',
  ON_HOLD:                'on_hold',
  CANCELLED:              'cancelled'
});

// ─── Stage definitions with UI metadata ──────────────────────────────────────

export const STAGE_DEFINITIONS = Object.freeze([
  {
    id: STAGE.REGISTRATION,
    label: 'Registration',
    icon: 'UserPlus',
    color: 'gray',
    statuses: [STATUS.REGISTERED, STATUS.PRE_SCREENED]
  },
  {
    id: STAGE.DEMAND_MATCHING,
    label: 'Demand & Matching',
    icon: 'Briefcase',
    color: 'indigo',
    statuses: [STATUS.DEMAND_SEARCHING, STATUS.DEMAND_ALLOCATED]
  },
  {
    id: STAGE.TRADE_TEST,
    label: 'Trade Test',
    icon: 'Wrench',
    color: 'fuchsia',
    optional: true,
    statuses: [STATUS.TRADE_TEST_SCHEDULED, STATUS.TRADE_TEST_PASSED, STATUS.TRADE_TEST_FAILED]
  },
  {
    id: STAGE.MEDICAL,
    label: 'Medical Examination',
    icon: 'Stethoscope',
    color: 'teal',
    statuses: [
      STATUS.MEDICAL_SCHEDULED,
      STATUS.MEDICAL_PASSED,
      STATUS.MEDICAL_FAILED,
      STATUS.MEDICAL_ON_HOLD,
      STATUS.MEDICAL_EXPIRED
    ]
  },
  {
    id: STAGE.CALLING_VISA,
    label: 'Calling Visa',
    icon: 'Mail',
    color: 'yellow',
    statuses: [STATUS.CALLING_VISA_PENDING, STATUS.CALLING_VISA_RECEIVED]
  },
  {
    id: STAGE.COMPLIANCE,
    label: 'Insurance / SSF / Welfare',
    icon: 'ShieldCheck',
    color: 'blue',
    statuses: [
      STATUS.COMPLIANCE_PENDING,
      STATUS.INSURANCE_DONE,
      STATUS.SSF_DONE,
      STATUS.WELFARE_DONE,
      STATUS.COMPLIANCE_COMPLETE
    ]
  },
  {
    id: STAGE.DOCUMENTATION,
    label: 'Documentation',
    icon: 'FolderOpen',
    color: 'violet',
    statuses: [STATUS.PASSPORT_PENDING, STATUS.PASSPORT_COLLECTED, STATUS.DOCUMENTS_COMPLETE]
  },
  {
    id: STAGE.ORIENTATION,
    label: 'Pre-Departure Orientation',
    icon: 'GraduationCap',
    color: 'purple',
    statuses: [STATUS.ORIENTATION_SCHEDULED, STATUS.ORIENTATION_COMPLETED, STATUS.ORIENTATION_ABSENT]
  },
  {
    id: STAGE.PURBA_SWUKRITI,
    label: 'Purba Swukriti',
    icon: 'BadgeCheck',
    color: 'lime',
    statuses: [STATUS.PURBA_SWUKRITI_APPLIED, STATUS.PURBA_SWUKRITI_ISSUED]
  },
  {
    id: STAGE.VISA_STAMPING,
    label: 'Visa Stamping',
    icon: 'Stamp',
    color: 'amber',
    regions: ['gulf'],
    statuses: [STATUS.VISA_APPLIED, STATUS.VISA_STAMPED, STATUS.VISA_REJECTED]
  },
  {
    id: STAGE.PLKS,
    label: 'PLKS / E-Sticker',
    icon: 'Sticker',
    color: 'rose',
    regions: ['malaysia'],
    statuses: [
      STATUS.PLKS_APPLIED,
      STATUS.PLKS_RECEIVED,
      STATUS.ESTICKER_APPLIED,
      STATUS.ESTICKER_RECEIVED
    ]
  },
  {
    id: STAGE.FEIMS_SUBMISSION,
    label: 'FEIMS Submission',
    icon: 'Globe',
    color: 'cyan',
    statuses: [STATUS.FEIMS_PENDING, STATUS.FEIMS_SUBMITTED, STATUS.FEIMS_REGISTERED]
  },
  {
    id: STAGE.SHRAM_SWUKRITI,
    label: 'Shram Swukriti',
    icon: 'FileCheck',
    color: 'orange',
    statuses: [STATUS.SHRAM_APPLIED, STATUS.SHRAM_ISSUED]
  },
  {
    id: STAGE.DEPARTURE_PREP,
    label: 'Departure Preparation',
    icon: 'PlaneTakeoff',
    color: 'sky',
    statuses: [STATUS.FLIGHT_BOOKED, STATUS.AIRPORT_SLOT_ASSIGNED]
  },
  {
    id: STAGE.POST_DEPARTURE,
    label: 'Post-Departure',
    icon: 'MapPin',
    color: 'green',
    statuses: [STATUS.DEPARTED, STATUS.ABROAD, STATUS.CONTRACT_EXPIRED, STATUS.RETURNED]
  }
]);

export const SPECIAL_STATUSES = Object.freeze([STATUS.ON_HOLD, STATUS.CANCELLED]);

export const ALL_STATUSES = Object.freeze([
  ...STAGE_DEFINITIONS.flatMap(s => s.statuses),
  ...SPECIAL_STATUSES
]);

// ─── Display labels ──────────────────────────────────────────────────────────

export const STATUS_LABELS = Object.freeze({
  registered:             'Registered',
  pre_screened:           'Pre-Screened',
  demand_searching:       'Demand Searching',
  demand_allocated:       'Demand Allocated',
  trade_test_scheduled:   'Trade Test Scheduled',
  trade_test_passed:      'Trade Test Passed',
  trade_test_failed:      'Trade Test Failed',
  passport_pending:       'Passport Pending',
  passport_collected:     'Passport Collected',
  documents_complete:     'Documents Complete',
  medical_scheduled:      'Medical Scheduled',
  medical_passed:         'Medical Passed',
  medical_failed:         'Medical Failed',
  medical_on_hold:        'Medical On Hold',
  medical_expired:        'Medical Expired',
  calling_visa_pending:   'Calling Visa Pending',
  calling_visa_received:  'Calling Visa Received',
  compliance_pending:     'Compliance Pending',
  insurance_done:         'Insurance Done',
  ssf_done:               'SSF Done',
  welfare_done:           'Welfare Done',
  compliance_complete:    'Compliance Complete',
  orientation_scheduled:  'Orientation Scheduled',
  orientation_completed:  'Orientation Completed',
  orientation_absent:     'Orientation Absent',
  purba_swukriti_applied: 'Purba Swukriti Applied',
  purba_swukriti_issued:  'Purba Swukriti Issued',
  visa_applied:           'Visa Applied',
  visa_stamped:           'Visa Stamped',
  visa_rejected:          'Visa Rejected',
  plks_applied:           'PLKS Applied',
  plks_received:          'PLKS Received',
  esticker_applied:       'E-Sticker Applied',
  esticker_received:      'E-Sticker Received',
  feims_pending:          'FEIMS Pending',
  feims_submitted:        'FEIMS Submitted',
  feims_registered:       'FEIMS Registered',
  shram_applied:          'Shram Applied',
  shram_issued:           'Shram Issued',
  flight_booked:          'Flight Booked',
  airport_slot_assigned:  'Airport Slot Assigned',
  departed:               'Departed',
  abroad:                 'Abroad',
  contract_expired:       'Contract Expired',
  returned:               'Returned',
  on_hold:                'On Hold',
  cancelled:              'Cancelled'
});

// ─── Tailwind colour classes per status ──────────────────────────────────────

export const STATUS_COLORS = Object.freeze({
  registered:             'bg-gray-100 text-gray-800',
  pre_screened:           'bg-gray-200 text-gray-900',
  demand_searching:       'bg-slate-100 text-slate-800',
  demand_allocated:       'bg-indigo-100 text-indigo-800',
  trade_test_scheduled:   'bg-fuchsia-100 text-fuchsia-700',
  trade_test_passed:      'bg-fuchsia-200 text-fuchsia-900',
  trade_test_failed:      'bg-red-100 text-red-800',
  passport_pending:       'bg-violet-100 text-violet-700',
  passport_collected:     'bg-violet-200 text-violet-900',
  documents_complete:     'bg-violet-300 text-violet-900',
  medical_scheduled:      'bg-teal-100 text-teal-700',
  medical_passed:         'bg-teal-200 text-teal-900',
  medical_failed:         'bg-red-100 text-red-800',
  medical_on_hold:        'bg-yellow-100 text-yellow-800',
  medical_expired:        'bg-red-200 text-red-900',
  calling_visa_pending:   'bg-yellow-100 text-yellow-800',
  calling_visa_received:  'bg-yellow-200 text-yellow-900',
  compliance_pending:     'bg-blue-100 text-blue-700',
  insurance_done:         'bg-blue-100 text-blue-800',
  ssf_done:               'bg-blue-200 text-blue-800',
  welfare_done:           'bg-blue-200 text-blue-900',
  compliance_complete:    'bg-blue-300 text-blue-900',
  orientation_scheduled:  'bg-purple-100 text-purple-700',
  orientation_completed:  'bg-purple-200 text-purple-900',
  orientation_absent:     'bg-red-100 text-red-700',
  purba_swukriti_applied: 'bg-lime-100 text-lime-700',
  purba_swukriti_issued:  'bg-lime-200 text-lime-900',
  visa_applied:           'bg-amber-100 text-amber-700',
  visa_stamped:           'bg-amber-200 text-amber-900',
  visa_rejected:          'bg-red-100 text-red-800',
  plks_applied:           'bg-rose-100 text-rose-700',
  plks_received:          'bg-rose-200 text-rose-900',
  esticker_applied:       'bg-rose-100 text-rose-700',
  esticker_received:      'bg-rose-200 text-rose-900',
  feims_pending:          'bg-cyan-100 text-cyan-700',
  feims_submitted:        'bg-cyan-200 text-cyan-800',
  feims_registered:       'bg-cyan-300 text-cyan-900',
  shram_applied:          'bg-orange-100 text-orange-700',
  shram_issued:           'bg-orange-200 text-orange-900',
  flight_booked:          'bg-sky-100 text-sky-800',
  airport_slot_assigned:  'bg-sky-200 text-sky-900',
  departed:               'bg-green-100 text-green-800',
  abroad:                 'bg-green-200 text-green-900',
  contract_expired:       'bg-gray-200 text-gray-700',
  returned:               'bg-gray-100 text-gray-800',
  on_hold:                'bg-yellow-100 text-yellow-800',
  cancelled:              'bg-red-100 text-red-800'
});

export const STAGE_COLORS = Object.freeze(
  Object.fromEntries(STAGE_DEFINITIONS.map(s => [s.id, s.color]))
);

// ─── Derived lookups ─────────────────────────────────────────────────────────

export const STAGE_FOR_STATUS = Object.freeze(
  Object.fromEntries(
    STAGE_DEFINITIONS.flatMap(stage =>
      stage.statuses.map(status => [status, stage.id])
    )
  )
);

export const STAGE_ORDER = Object.freeze(
  Object.fromEntries(STAGE_DEFINITIONS.map((s, i) => [s.id, i]))
);

export const TERMINAL_STATUSES = Object.freeze(new Set([
  STATUS.DEPARTED,
  STATUS.RETURNED,
  STATUS.CANCELLED
]));

export const BLOCKING_STATUSES = Object.freeze(new Set([
  STATUS.TRADE_TEST_FAILED,
  STATUS.MEDICAL_FAILED,
  STATUS.MEDICAL_EXPIRED,
  STATUS.ORIENTATION_ABSENT,
  STATUS.VISA_REJECTED,
  STATUS.ON_HOLD,
  STATUS.CANCELLED
]));

// ─── Pure helpers ────────────────────────────────────────────────────────────

export function getStageForStatus(status) {
  return STAGE_FOR_STATUS[status] || null;
}

export function isTerminal(status) {
  return TERMINAL_STATUSES.has(status);
}

export function isBlocking(status) {
  return BLOCKING_STATUSES.has(status);
}

export function getStageDefinition(stageId) {
  return STAGE_DEFINITIONS.find(s => s.id === stageId) || null;
}

export function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function getStatusColor(status) {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
}
