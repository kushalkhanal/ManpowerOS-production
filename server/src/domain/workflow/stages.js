/**
 * Stages — pure domain definitions for candidate statuses and pipeline stages.
 *
 * The stage list is the canonical sequence applicable across both regions
 * (Gulf and Malaysia). Country-specific differences are expressed at the
 * pipeline level (see pipelines.js) by enabling/disabling stages and
 * by mapping region-specific statuses onto the generic stages.
 *
 * Pure domain module — no Mongoose, no Express, no I/O.
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
  // Registration
  REGISTERED:             'registered',
  PRE_SCREENED:           'pre_screened',
  // Demand matching
  DEMAND_SEARCHING:       'demand_searching',
  DEMAND_ALLOCATED:       'demand_allocated',
  // Trade test
  TRADE_TEST_SCHEDULED:   'trade_test_scheduled',
  TRADE_TEST_PASSED:      'trade_test_passed',
  TRADE_TEST_FAILED:      'trade_test_failed',
  // Documentation
  PASSPORT_PENDING:       'passport_pending',
  PASSPORT_COLLECTED:     'passport_collected',
  DOCUMENTS_COMPLETE:     'documents_complete',
  // Medical (Gulf: GAMCA, Malaysia: FOMEMA)
  MEDICAL_SCHEDULED:      'medical_scheduled',
  MEDICAL_PASSED:         'medical_passed',
  MEDICAL_FAILED:         'medical_failed',
  MEDICAL_ON_HOLD:        'medical_on_hold',
  MEDICAL_EXPIRED:        'medical_expired',
  // Calling visa (Gulf: MOFA, Malaysia: VLN/VDR)
  CALLING_VISA_PENDING:   'calling_visa_pending',
  CALLING_VISA_RECEIVED:  'calling_visa_received',
  // Compliance (Insurance + SSF + Welfare Fund)
  COMPLIANCE_PENDING:     'compliance_pending',
  INSURANCE_DONE:         'insurance_done',
  SSF_DONE:               'ssf_done',
  WELFARE_DONE:           'welfare_done',
  COMPLIANCE_COMPLETE:    'compliance_complete',
  // Orientation (PDOT)
  ORIENTATION_SCHEDULED:  'orientation_scheduled',
  ORIENTATION_COMPLETED:  'orientation_completed',
  ORIENTATION_ABSENT:     'orientation_absent',
  // Purba Swukriti (DoFE pre-approval)
  PURBA_SWUKRITI_APPLIED: 'purba_swukriti_applied',
  PURBA_SWUKRITI_ISSUED:  'purba_swukriti_issued',
  // Visa stamping (Gulf only)
  VISA_APPLIED:           'visa_applied',
  VISA_STAMPED:           'visa_stamped',
  VISA_REJECTED:          'visa_rejected',
  // PLKS (Malaysia only)
  PLKS_APPLIED:           'plks_applied',
  PLKS_RECEIVED:          'plks_received',
  // Legacy aliases retained for backwards compat with existing data
  ESTICKER_APPLIED:       'esticker_applied',
  ESTICKER_RECEIVED:      'esticker_received',
  // FEIMS submission to gov site
  FEIMS_PENDING:          'feims_pending',
  FEIMS_SUBMITTED:        'feims_submitted',
  FEIMS_REGISTERED:       'feims_registered',
  // Shram Swukriti (DoFE labor permit)
  SHRAM_APPLIED:          'shram_applied',
  SHRAM_ISSUED:           'shram_issued',
  // Departure prep
  FLIGHT_BOOKED:          'flight_booked',
  AIRPORT_SLOT_ASSIGNED:  'airport_slot_assigned',
  // Post-departure
  DEPARTED:               'departed',
  ABROAD:                 'abroad',
  CONTRACT_EXPIRED:       'contract_expired',
  RETURNED:               'returned',
  // Special states (cross-cutting, can occur at any stage)
  ON_HOLD:                'on_hold',
  CANCELLED:              'cancelled'
});

// ─── Stage definitions (canonical sequence) ──────────────────────────────────
// Ordering reflects the typical real-world DoFE-aligned sequence. Pipelines
// pick which stages apply per region.

export const STAGE_DEFINITIONS = Object.freeze([
  {
    id: STAGE.REGISTRATION,
    label: 'Registration',
    statuses: [STATUS.REGISTERED, STATUS.PRE_SCREENED]
  },
  {
    id: STAGE.DEMAND_MATCHING,
    label: 'Demand & Matching',
    statuses: [STATUS.DEMAND_SEARCHING, STATUS.DEMAND_ALLOCATED]
  },
  {
    id: STAGE.TRADE_TEST,
    label: 'Trade Test',
    statuses: [STATUS.TRADE_TEST_SCHEDULED, STATUS.TRADE_TEST_PASSED, STATUS.TRADE_TEST_FAILED],
    optional: true
  },
  {
    id: STAGE.DOCUMENTATION,
    label: 'Documentation',
    statuses: [STATUS.PASSPORT_PENDING, STATUS.PASSPORT_COLLECTED, STATUS.DOCUMENTS_COMPLETE]
  },
  {
    id: STAGE.MEDICAL,
    label: 'Medical Examination',
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
    statuses: [STATUS.CALLING_VISA_PENDING, STATUS.CALLING_VISA_RECEIVED]
  },
  {
    id: STAGE.COMPLIANCE,
    label: 'Insurance / SSF / Welfare',
    statuses: [
      STATUS.COMPLIANCE_PENDING,
      STATUS.INSURANCE_DONE,
      STATUS.SSF_DONE,
      STATUS.WELFARE_DONE,
      STATUS.COMPLIANCE_COMPLETE
    ]
  },
  {
    id: STAGE.ORIENTATION,
    label: 'Pre-Departure Orientation',
    statuses: [STATUS.ORIENTATION_SCHEDULED, STATUS.ORIENTATION_COMPLETED, STATUS.ORIENTATION_ABSENT]
  },
  {
    id: STAGE.PURBA_SWUKRITI,
    label: 'Purba Swukriti',
    statuses: [STATUS.PURBA_SWUKRITI_APPLIED, STATUS.PURBA_SWUKRITI_ISSUED]
  },
  {
    id: STAGE.VISA_STAMPING,
    label: 'Visa Stamping',
    statuses: [STATUS.VISA_APPLIED, STATUS.VISA_STAMPED, STATUS.VISA_REJECTED],
    regions: ['gulf']
  },
  {
    id: STAGE.PLKS,
    label: 'PLKS / E-Sticker',
    statuses: [
      STATUS.PLKS_APPLIED,
      STATUS.PLKS_RECEIVED,
      STATUS.ESTICKER_APPLIED,
      STATUS.ESTICKER_RECEIVED
    ],
    regions: ['malaysia']
  },
  {
    id: STAGE.FEIMS_SUBMISSION,
    label: 'FEIMS Submission',
    statuses: [STATUS.FEIMS_PENDING, STATUS.FEIMS_SUBMITTED, STATUS.FEIMS_REGISTERED]
  },
  {
    id: STAGE.SHRAM_SWUKRITI,
    label: 'Shram Swukriti',
    statuses: [STATUS.SHRAM_APPLIED, STATUS.SHRAM_ISSUED]
  },
  {
    id: STAGE.DEPARTURE_PREP,
    label: 'Departure Preparation',
    statuses: [STATUS.FLIGHT_BOOKED, STATUS.AIRPORT_SLOT_ASSIGNED]
  },
  {
    id: STAGE.POST_DEPARTURE,
    label: 'Post-Departure',
    statuses: [STATUS.DEPARTED, STATUS.ABROAD, STATUS.CONTRACT_EXPIRED, STATUS.RETURNED]
  }
]);

export const SPECIAL_STATUSES = Object.freeze([STATUS.ON_HOLD, STATUS.CANCELLED]);

// ─── Derived sets / lookups ──────────────────────────────────────────────────

export const ALL_STATUSES = Object.freeze([
  ...STAGE_DEFINITIONS.flatMap(s => s.statuses),
  ...SPECIAL_STATUSES
]);

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
